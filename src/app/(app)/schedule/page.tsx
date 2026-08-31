import { requireUser } from "@/lib/auth";
import { getDayAgenda, getStudyDays, getSubjectsWithTopics } from "@/lib/data";
import { todayISO, formatDayLong } from "@/lib/dates";
import { SubHeader } from "@/components/sub-header";
import { MonthCalendar } from "@/components/schedule/month-calendar";
import { NewAgendamentoButton } from "@/components/schedule/new-agendamento-button";
import { AgendaList } from "@/components/agenda-list";
import { StudyGoalSettings } from "@/components/study-goal-settings";

const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;

export default async function SchedulePage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const { date } = await searchParams;
  const user = await requireUser();
  const iso = date && ISO_RE.test(date) ? date : todayISO();

  const [agenda, subjects, studyDays] = await Promise.all([
    getDayAgenda(user.id, iso),
    getSubjectsWithTopics(user.id),
    getStudyDays(user.id),
  ]);
  const studiedSeconds = studyDays.find((day) => day.dateISO === iso)?.studiedSeconds ?? 0;

  return (
    <div>
      <SubHeader title="Ajustar Cronograma">
        <StudyGoalSettings initialGoalMinutes={user.dailyStudyGoalMinutes} />
      </SubHeader>

      <MonthCalendar selectedISO={iso} studyDays={studyDays} dailyGoalMinutes={user.dailyStudyGoalMinutes} />

      <div className="mt-5 panel flex flex-col gap-2.5 p-2.5">
        <div className="flex items-center justify-between px-1">
          <h2 className="subtitle font-normal first-letter:uppercase">{formatDayLong(iso)}</h2>
          <NewAgendamentoButton subjects={subjects} defaultDateISO={iso} />
        </div>
        <AgendaList
          items={agenda}
          reorder={{ kind: "day", dateISO: iso }}
          deleteMode="trash"
          tinted
          studiedSeconds={studiedSeconds}
          dailyGoalMinutes={user.dailyStudyGoalMinutes}
          emptyText="Nenhum agendamento nesta data."
        />
      </div>
    </div>
  );
}
