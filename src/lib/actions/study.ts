"use server";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isoToDate } from "@/lib/dates";
import { revalidateApp } from "@/lib/actions/revalidate";

export type ActionResult = { ok: true } | { ok: false; error: string };

const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function updateStudyGoal(minutes: number): Promise<ActionResult> {
  const user = await requireUser();
  const normalized = Math.round(minutes);
  if (!Number.isFinite(normalized) || normalized < 1 || normalized > 1440) {
    return { ok: false, error: "Informe uma meta entre 1 e 1440 minutos." };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { dailyStudyGoalMinutes: normalized },
  });
  revalidateApp();
  return { ok: true };
}

export async function recordStudyTime(dateISO: string, seconds: number): Promise<void> {
  const user = await requireUser();
  const normalized = Math.round(seconds);
  if (!ISO_RE.test(dateISO) || !Number.isFinite(normalized) || normalized < 1 || normalized > 60) return;

  const date = isoToDate(dateISO);
  await prisma.studyDay.upsert({
    where: { userId_date: { userId: user.id, date } },
    create: { userId: user.id, date, studiedSeconds: normalized },
    update: { studiedSeconds: { increment: normalized } },
  });
}
