"use server";

import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { dateToISO, dayRange, isoToDate } from "@/lib/dates";
import { revalidateApp } from "@/lib/actions/revalidate";

export type ActionResult = { ok: true } | { ok: false; error: string };

export type AgendamentoInput = {
  topicId?: string;
  subjectId?: string;
  topicName?: string;
  name: string;
  link?: string;
  dateISO?: string;
};

function normalizeLink(link: string | undefined): string | null {
  const trimmed = (link ?? "").trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function parseDate(dateISO: string | undefined): Date | null {
  const value = (dateISO ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  return isoToDate(value);
}

async function nextDayOrder(userId: string, date: Date): Promise<number> {
  const iso = dateToISO(date);
  const { start, end } = dayRange(iso);
  const current = await prisma.agendamento.aggregate({
    where: {
      date: { gte: start, lt: end },
      topic: { subject: { userId } },
    },
    _max: { dayOrder: true },
  });
  return (current._max.dayOrder ?? -1) + 1;
}

function isSameDate(left: Date | null, right: Date | null): boolean {
  return left?.getTime() === right?.getTime();
}

async function ownsTopic(userId: string, topicId: string): Promise<boolean> {
  const topic = await prisma.topic.findFirst({
    where: { id: topicId, subject: { userId } },
    select: { id: true },
  });
  return Boolean(topic);
}

export async function createAgendamento(input: AgendamentoInput): Promise<ActionResult> {
  const user = await requireUser();
  const name = input.name.trim().slice(0, 120);
  if (!name) return { ok: false, error: "Informe o nome do agendamento." };
  const date = parseDate(input.dateISO);
  const dayOrder = date ? await nextDayOrder(user.id, date) : null;

  if (input.topicId) {
    if (!(await ownsTopic(user.id, input.topicId))) {
      return { ok: false, error: "Tópico não encontrado." };
    }

    const count = await prisma.agendamento.count({ where: { topicId: input.topicId } });
    await prisma.agendamento.create({
      data: {
        name,
        link: normalizeLink(input.link),
        date,
        dayOrder,
        order: count,
        topicId: input.topicId,
      },
    });
    revalidateApp();
    return { ok: true };
  }

  const topicName = input.topicName?.trim().slice(0, 120);
  if (!input.subjectId || !topicName) {
    return { ok: false, error: "Informe o novo tópico." };
  }
  const subject = await prisma.subject.findFirst({
    where: { id: input.subjectId, userId: user.id },
    select: { id: true },
  });
  if (!subject) return { ok: false, error: "Matéria não encontrada." };

  const topicCount = await prisma.topic.count({ where: { subjectId: subject.id } });
  await prisma.$transaction(async (tx) => {
    const topic = await tx.topic.create({
      data: { name: topicName, order: topicCount, subjectId: subject.id },
    });
    await tx.agendamento.create({
      data: {
        name,
        link: normalizeLink(input.link),
        date,
        dayOrder,
        order: 0,
        topicId: topic.id,
      },
    });
  });
  revalidateApp();
  return { ok: true };
}

export async function updateAgendamento(id: string, input: Omit<AgendamentoInput, "topicId">): Promise<ActionResult> {
  const user = await requireUser();
  const name = input.name.trim().slice(0, 120);
  if (!name) return { ok: false, error: "Informe o nome do agendamento." };

  const current = await prisma.agendamento.findFirst({
    where: { id, topic: { subject: { userId: user.id } } },
    select: { date: true, dayOrder: true },
  });
  if (!current) return { ok: true };

  const date = parseDate(input.dateISO);
  const dayOrder = !date
    ? null
    : isSameDate(current.date, date) && current.dayOrder !== null
      ? current.dayOrder
      : await nextDayOrder(user.id, date);

  await prisma.agendamento.updateMany({
    where: { id, topic: { subject: { userId: user.id } } },
    data: {
      name,
      link: normalizeLink(input.link),
      date,
      dayOrder,
    },
  });
  revalidateApp();
  return { ok: true };
}

export async function scheduleAgendamento(id: string, dateISO: string): Promise<ActionResult> {
  const user = await requireUser();
  if (!id) return { ok: false, error: "Selecione um agendamento." };
  const date = parseDate(dateISO);
  if (!date) return { ok: false, error: "Informe a data do agendamento." };

  const current = await prisma.agendamento.findFirst({
    where: { id, topic: { subject: { userId: user.id } } },
    select: { date: true, dayOrder: true },
  });
  if (!current) return { ok: false, error: "Agendamento não encontrado." };
  const dayOrder =
    isSameDate(current.date, date) && current.dayOrder !== null ? current.dayOrder : await nextDayOrder(user.id, date);

  await prisma.agendamento.updateMany({
    where: { id, topic: { subject: { userId: user.id } } },
    data: { date, dayOrder },
  });
  revalidateApp();
  return { ok: true };
}

export async function toggleAgendamento(id: string): Promise<void> {
  const user = await requireUser();
  const current = await prisma.agendamento.findFirst({
    where: { id, topic: { subject: { userId: user.id } } },
    select: { isCompleted: true },
  });
  if (!current) return;
  await prisma.agendamento.update({
    where: { id },
    data: { isCompleted: !current.isCompleted },
  });
  revalidateApp();
}

export async function deleteAgendamento(id: string): Promise<void> {
  const user = await requireUser();
  await prisma.agendamento.deleteMany({
    where: { id, topic: { subject: { userId: user.id } } },
  });
  revalidateApp();
}

export async function reorderTopicAgendamentos(topicId: string, orderedIds: string[]): Promise<void> {
  const user = await requireUser();
  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.agendamento.updateMany({
        where: { id, topicId, topic: { subject: { userId: user.id } } },
        data: { order: index },
      }),
    ),
  );
  revalidateApp();
}

export async function reorderDayAgendamentos(dateISO: string, orderedIds: string[]): Promise<void> {
  const user = await requireUser();
  const date = parseDate(dateISO);
  if (!date) return;
  const { start, end } = dayRange(dateISO);

  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.agendamento.updateMany({
        where: {
          id,
          date: { gte: start, lt: end },
          topic: { subject: { userId: user.id } },
        },
        data: { dayOrder: index },
      }),
    ),
  );
  revalidateApp();
}
