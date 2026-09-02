import "server-only";
import { prisma } from "@/lib/db";
import { dateToISO, dayRange } from "@/lib/dates";
import type { StudyTemplate, TemplateImportAvailability } from "@/lib/templates/catalog";
import { normalizeTemplateName } from "@/lib/templates/names";

export type SubjectSummary = {
  id: string;
  name: string;
  color: string;
  order: number;
};

export async function getSubjects(userId: string): Promise<SubjectSummary[]> {
  return prisma.subject.findMany({
    where: { userId },
    orderBy: [{ order: "asc" }, { name: "asc" }],
    select: { id: true, name: true, color: true, order: true, isPublic: true },
  });
}

export async function getSubjectDetail(userId: string, subjectId: string) {
  return prisma.subject.findFirst({
    where: {
      id: subjectId,
      OR: [{ userId: userId }, { isPublic: true }],
    },
    include: {
      topics: {
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
        include: {
          agendamentos: {
            orderBy: [{ order: "asc" }, { createdAt: "asc" }],
          },
        },
      },
    },
  });
}

export type DayItem = {
  id: string;
  name: string;
  link: string | null;
  isCompleted: boolean;
  order: number;
  subjectId: string;
  subjectName: string;
  subjectColor: string;
  topicName: string;
};

export async function getDayAgenda(userId: string, iso: string): Promise<DayItem[]> {
  const [day] = await getDayAgendas(userId, [iso]);
  return day?.items ?? [];
}

export type DayAgenda = {
  dateISO: string;
  items: DayItem[];
};

export async function getDayAgendas(userId: string, dateISOs: string[]): Promise<DayAgenda[]> {
  if (dateISOs.length === 0) return [];
  const orderedDates = [...new Set(dateISOs)].sort();
  const { start } = dayRange(orderedDates[0]);
  const { end } = dayRange(orderedDates.at(-1)!);
  const rows = await prisma.agendamento.findMany({
    where: {
      date: { gte: start, lt: end },
      topic: { subject: { userId } },
    },
    orderBy: [{ dayOrder: "asc" }, { createdAt: "asc" }],
    include: { topic: { include: { subject: true } } },
  });

  const itemsByDate = new Map(dateISOs.map((dateISO) => [dateISO, [] as DayItem[]]));
  rows.forEach((row) => {
    if (!row.date) return;
    itemsByDate.get(dateToISO(row.date))?.push(toDayItem(row));
  });

  return dateISOs.map((dateISO) => ({ dateISO, items: itemsByDate.get(dateISO) ?? [] }));
}

function toDayItem(a: {
  id: string;
  name: string;
  link: string | null;
  isCompleted: boolean;
  order: number;
  topic: { name: string; subject: { id: string; name: string; color: string } };
}): DayItem {
  return {
    id: a.id,
    name: a.name,
    link: a.link,
    isCompleted: a.isCompleted,
    order: a.order,
    subjectId: a.topic.subject.id,
    subjectName: a.topic.subject.name,
    subjectColor: a.topic.subject.color,
    topicName: a.topic.name,
  };
}

export type StudyDaySummary = {
  dateISO: string;
  studiedSeconds: number;
};

export async function getStudyDays(userId: string): Promise<StudyDaySummary[]> {
  const rows = await prisma.studyDay.findMany({
    where: { userId },
    orderBy: { date: "asc" },
    select: { date: true, studiedSeconds: true },
  });

  return rows.map((row) => ({
    dateISO: dateToISO(row.date),
    studiedSeconds: row.studiedSeconds,
  }));
}

export function getSubjectsWithTopics(userId: string) {
  return prisma.subject.findMany({
    where: { userId },
    orderBy: [{ order: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      topics: {
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          name: true,
          agendamentos: {
            orderBy: [{ order: "asc" }, { createdAt: "asc" }],
            select: { id: true, name: true },
          },
        },
      },
    },
  });
}

export async function getTemplateImportAvailability(
  userId: string,
  template: StudyTemplate,
): Promise<TemplateImportAvailability> {
  const subjects = await prisma.subject.findMany({
    where: { userId },
    select: {
      name: true,
      topics: { select: { name: true } },
    },
  });

  return Object.fromEntries(
    template.subjects.map((templateSubject) => {
      const matchingSubjects = subjects.filter(
        (subject) => normalizeTemplateName(subject.name) === normalizeTemplateName(templateSubject.name),
      );
      const existingTopicNames = new Set(
        matchingSubjects.flatMap((subject) => subject.topics.map((topic) => normalizeTemplateName(topic.name))),
      );

      return [
        templateSubject.key,
        {
          existingSubject: matchingSubjects.length > 0,
          existingTopicKeys: templateSubject.topics
            .filter((topic) => existingTopicNames.has(normalizeTemplateName(topic.name)))
            .map((topic) => topic.key),
        },
      ];
    }),
  );
}
