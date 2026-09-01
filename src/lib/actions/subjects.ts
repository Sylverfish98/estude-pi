"use server";

import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { normalizeColor } from "@/lib/colors";
import { revalidateApp } from "@/lib/actions/revalidate";

export type ActionResult = { ok: true } | { ok: false; error: string };

function cleanName(raw: FormDataEntryValue | string | null, max: number): string {
  return String(raw ?? "")
    .trim()
    .slice(0, max);
}

export async function createSubject(name: string, color: string): Promise<ActionResult> {
  const user = await requireUser();
  const cleaned = cleanName(name, 25);
  if (!cleaned) return { ok: false, error: "Informe o nome da matéria." };

  const count = await prisma.subject.count({ where: { userId: user.id } });
  const data = await prisma.subject.create({
    data: { name: cleaned, color: normalizeColor(color), order: count, userId: user.id },
  });
  revalidateApp();
  return { ok: true };
}

export async function updateSubject(id: string, name: string, color: string, isPublic: boolean): Promise<ActionResult> {
  const user = await requireUser();
  const cleaned = cleanName(name, 25);
  if (!cleaned) return { ok: false, error: "Informe o nome da matéria." };

  await prisma.subject.updateMany({
    where: { id, userId: user.id },
    data: { name: cleaned, color: normalizeColor(color), isPublic },
  });
  revalidateApp();
  return { ok: true };
}

export async function setSubjectPublicStatus(id: string, status: boolean) {
  const user = await requireUser();

  await prisma.subject.updateMany({
    where: { id, userId: user.id },
    data: { isPublic: status },
  });
  revalidateApp();
  return { ok: true };
}

export async function deleteSubject(id: string): Promise<void> {
  const user = await requireUser();
  await prisma.subject.deleteMany({ where: { id, userId: user.id } });
  revalidateApp();
}

export async function reorderSubjects(orderedIds: string[]): Promise<void> {
  const user = await requireUser();
  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.subject.updateMany({
        where: { id, userId: user.id },
        data: { order: index },
      }),
    ),
  );
}

export async function copySubject(sourceSubjectId: string): Promise<ActionResult> {
  const user = await requireUser();

  const source = await prisma.subject.findFirst({
    where: {
      id: sourceSubjectId,
      isPublic: true,
    },
    include: {
      topics: {
        orderBy: { order: "asc" },
        include: {
          agendamentos: {
            orderBy: { order: "asc" },
          },
        },
      },
    },
  });

  if (!source) {
    return { ok: false, error: "Matéria não encontrada ou indisponível." };
  }

  const count = await prisma.subject.count({ where: { userId: user.id } });

  await prisma.$transaction(async (tx) => {
    const newSubject = await tx.subject.create({
      data: {
        name: source.name,
        color: source.color,
        order: count,
        userId: user.id,
        isPublic: false,
      },
    });

    for (const topic of source.topics) {
      const newTopic = await tx.topic.create({
        data: {
          name: topic.name,
          order: topic.order,
          subjectId: newSubject.id,
        },
      });

      if (topic.agendamentos.length > 0) {
        await tx.agendamento.createMany({
          data: topic.agendamentos.map((item) => ({
            name: item.name,
            order: item.order,
            topicId: newTopic.id,
            isCompleted: false,
          })),
        });
      }
    }
  });

  revalidateApp();
  return { ok: true };
}
