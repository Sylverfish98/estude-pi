import { requireUser } from "@/lib/auth";
import { getDayAgenda } from "@/lib/data";
import { todayISO } from "@/lib/dates";
import { TimerClient } from "@/components/timer/timer-client";

export default async function TimerPage() {
  const user = await requireUser();
  const agenda = await getDayAgenda(user.id, todayISO());

  return (
    <TimerClient
      initialItems={agenda.map((a) => ({
        id: a.id,
        name: a.name,
        isCompleted: a.isCompleted,
      }))}
    />
  );
}
