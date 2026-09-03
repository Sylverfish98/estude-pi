"use server";

import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { revalidateApp } from "@/lib/actions/revalidate";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function createTopic(subjectId: string, name: string): Promise<ActionResult> {
  const user = await requireUser();
  const cleaned = name.trim().slice(0, 120);
  if (!cleaned) return { ok: false, error: "Informe o nome do tópico." };

  const subject = await prisma.subject.findFirst({
    where: { id: subjectId, userId: user.id },
    select: { id: true },
  });
  if (!subject) return { ok: false, error: "Matéria não encontrada." };

  const count = await prisma.topic.count({ where: { subjectId } });
  await prisma.topic.create({ data: { name: cleaned, subjectId, order: count } });
  revalidateApp();
  return { ok: true };
}

export async function updateTopic(id: string, name: string): Promise<ActionResult> {
  const user = await requireUser();
  const cleaned = name.trim().slice(0, 120);
  if (!cleaned) return { ok: false, error: "Informe o nome do tópico." };

  await prisma.topic.updateMany({
    where: { id, subject: { userId: user.id } },
    data: { name: cleaned },
  });
  revalidateApp();
  return { ok: true };
}

export async function deleteTopic(id: string): Promise<void> {
  const user = await requireUser();
  await prisma.topic.deleteMany({ where: { id, subject: { userId: user.id } } });
  revalidateApp();
}

export async function reorderTopics(orderedIds: string[]): Promise<void> {
  const user = await requireUser();
  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.topic.updateMany({
        where: { id, subject: { userId: user.id } },
        data: { order: index },
      }),
    ),
  );
  revalidateApp();
}
