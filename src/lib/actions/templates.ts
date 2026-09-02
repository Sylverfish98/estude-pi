"use server";

import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { revalidateApp } from "@/lib/actions/revalidate";
import { dateToISO, isValidISODate, isoToDate, todayISO } from "@/lib/dates";
import { getStudyTemplate } from "@/lib/templates/catalog";
import { normalizeTemplateName } from "@/lib/templates/names";
import {
  buildAutoSchedule,
  SCHEDULE_WEEKDAYS,
  type ExistingDaySchedule,
  type SubjectScheduleQueue,
} from "@/lib/templates/auto-schedule";

const keySchema = z
  .string()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9-]+$/);

const importTemplateSchema = z.object({
  templateId: keySchema,
  selections: z
    .array(
      z.object({
        subjectKey: keySchema,
        topicKeys: z.array(keySchema).min(1).max(200),
      }),
    )
    .min(1)
    .max(100),
  autoSchedule: z
    .object({
      startDateISO: z.string().refine(isValidISODate),
      itemsPerDay: z.number().int().min(1).max(20),
      weekdays: z
        .array(z.enum(SCHEDULE_WEEKDAYS))
        .min(1)
        .max(7)
        .refine((weekdays) => new Set(weekdays).size === weekdays.length),
      countExisting: z.boolean(),
    })
    .optional(),
});

export type ImportTemplateInput = z.infer<typeof importTemplateSchema>;

export type ImportTemplateSummary = {
  subjectsCreated: number;
  subjectsMerged: number;
  topicsCreated: number;
  topicsSkipped: number;
  agendamentosCreated: number;
  agendamentosScheduled: number;
  firstScheduledDateISO: string | null;
  lastScheduledDateISO: string | null;
};

export type ImportTemplateResult = { ok: true; summary: ImportTemplateSummary } | { ok: false; error: string };

export async function importStudyTemplate(rawInput: ImportTemplateInput): Promise<ImportTemplateResult> {
  const user = await requireUser();
  const parsed = importTemplateSchema.safeParse(rawInput);
  if (!parsed.success) return { ok: false, error: "Seleção de importação inválida." };

  const template = getStudyTemplate(parsed.data.templateId);
  if (!template) return { ok: false, error: "Modelo não encontrado." };
  if (parsed.data.autoSchedule && parsed.data.autoSchedule.startDateISO < todayISO()) {
    return { ok: false, error: "A data de início não pode estar no passado." };
  }

  const selectedTopics = new Map<string, Set<string>>();
  for (const selection of parsed.data.selections) {
    const subject = template.subjects.find((candidate) => candidate.key === selection.subjectKey);
    if (!subject) return { ok: false, error: "Matéria do modelo não encontrada." };

    const topicSet = selectedTopics.get(subject.key) ?? new Set<string>();
    for (const topicKey of selection.topicKeys) {
      if (!subject.topics.some((topic) => topic.key === topicKey)) {
        return { ok: false, error: "Tópico do modelo não encontrado." };
      }
      topicSet.add(topicKey);
    }
    selectedTopics.set(subject.key, topicSet);
  }

  if (![...selectedTopics.values()].some((topics) => topics.size > 0)) {
    return { ok: false, error: "Selecione pelo menos um tópico." };
  }

  const summary = await prisma.$transaction(async (tx): Promise<ImportTemplateSummary> => {
    const ownedSubjects = await tx.subject.findMany({
      where: { userId: user.id },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      include: { topics: { orderBy: [{ order: "asc" }, { createdAt: "asc" }] } },
    });
    let nextSubjectOrder = ownedSubjects.reduce((maximum, subject) => Math.max(maximum, subject.order + 1), 0);
    const result: ImportTemplateSummary = {
      subjectsCreated: 0,
      subjectsMerged: 0,
      topicsCreated: 0,
      topicsSkipped: 0,
      agendamentosCreated: 0,
      agendamentosScheduled: 0,
      firstScheduledDateISO: null,
      lastScheduledDateISO: null,
    };
    const scheduleQueues: SubjectScheduleQueue<PendingAgendamento>[] = [];

    for (const templateSubject of template.subjects) {
      const requestedTopicKeys = selectedTopics.get(templateSubject.key);
      if (!requestedTopicKeys?.size) continue;

      const matchingSubjects = ownedSubjects.filter(
        (subject) => normalizeTemplateName(subject.name) === normalizeTemplateName(templateSubject.name),
      );
      const existingTopicNames = new Set(
        matchingSubjects.flatMap((subject) => subject.topics.map((topic) => normalizeTemplateName(topic.name))),
      );
      const topicsToCreate = templateSubject.topics.filter((topic) => requestedTopicKeys.has(topic.key));

      let targetSubject = matchingSubjects[0];
      let createdSubject = false;
      if (!targetSubject) {
        const created = await tx.subject.create({
          data: {
            name: templateSubject.name,
            color: templateSubject.color,
            order: nextSubjectOrder++,
            userId: user.id,
            isPublic: false,
          },
        });
        targetSubject = { ...created, topics: [] };
        ownedSubjects.push(targetSubject);
        createdSubject = true;
        result.subjectsCreated += 1;
      }

      let nextTopicOrder = targetSubject.topics.reduce((maximum, topic) => Math.max(maximum, topic.order + 1), 0);
      let mergedIntoSubject = false;
      const subjectItems: PendingAgendamento[] = [];

      for (const templateTopic of topicsToCreate) {
        const normalizedTopicName = normalizeTemplateName(templateTopic.name);
        if (existingTopicNames.has(normalizedTopicName)) {
          result.topicsSkipped += 1;
          continue;
        }

        const topic = await tx.topic.create({
          data: {
            name: templateTopic.name,
            order: nextTopicOrder++,
            subjectId: targetSubject.id,
          },
        });
        targetSubject.topics.push(topic);
        existingTopicNames.add(normalizedTopicName);
        result.topicsCreated += 1;
        mergedIntoSubject = !createdSubject;

        subjectItems.push(
          ...templateTopic.agendamentos.map((agendamento, index) => ({
            name: agendamento.name,
            link: agendamento.link ?? null,
            order: index,
            topicId: topic.id,
            isCompleted: false,
          })),
        );
        result.agendamentosCreated += templateTopic.agendamentos.length;
      }

      if (mergedIntoSubject) result.subjectsMerged += 1;
      if (subjectItems.length > 0) scheduleQueues.push({ subjectKey: templateSubject.key, items: subjectItems });
    }

    const pendingItems = scheduleQueues.flatMap((queue) => queue.items);
    if (parsed.data.autoSchedule && pendingItems.length > 0) {
      const existingRows = await tx.agendamento.findMany({
        where: {
          date: { gte: isoToDate(parsed.data.autoSchedule.startDateISO) },
          topic: { subject: { userId: user.id } },
        },
        select: { date: true, dayOrder: true },
      });
      const existingDays: Record<string, ExistingDaySchedule> = {};
      for (const row of existingRows) {
        if (!row.date) continue;
        const dateISO = dateToISO(row.date);
        const day = existingDays[dateISO] ?? { count: 0, maxDayOrder: -1 };
        day.count += 1;
        day.maxDayOrder = Math.max(day.maxDayOrder, row.dayOrder ?? -1);
        existingDays[dateISO] = day;
      }

      const assignments = buildAutoSchedule(scheduleQueues, {
        ...parsed.data.autoSchedule,
        existingDays,
      });
      await tx.agendamento.createMany({
        data: assignments.map(({ item, dateISO, dayOrder }) => ({
          ...item,
          date: isoToDate(dateISO),
          dayOrder,
        })),
      });
      result.agendamentosScheduled = assignments.length;
      result.firstScheduledDateISO = assignments[0]?.dateISO ?? null;
      result.lastScheduledDateISO = assignments.at(-1)?.dateISO ?? null;
    } else if (pendingItems.length > 0) {
      await tx.agendamento.createMany({ data: pendingItems });
    }

    return result;
  });

  revalidateApp();
  return { ok: true, summary };
}

type PendingAgendamento = {
  name: string;
  link: string | null;
  order: number;
  topicId: string;
  isCompleted: boolean;
};
