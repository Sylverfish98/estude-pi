import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getDayAgendas, getSubjects } from "@/lib/data";
import { addDaysISO, todayISO, formatDayLong } from "@/lib/dates";
import { SubjectCarousel } from "@/components/subject/subject-carousel";
import { NewSubjectButton } from "@/components/subject/new-subject-button";
import { AgendaList } from "@/components/agenda-list";
import { hasStudyTemplates } from "@/lib/templates/catalog";

export default async function HomePage() {
  const user = await requireUser();
  const iso = todayISO();
  const agendaDates = Array.from({ length: 4 }, (_, index) => addDaysISO(iso, index));
  const [subjects, dayAgendas] = await Promise.all([getSubjects(user.id), getDayAgendas(user.id, agendaDates)]);
  const agenda = dayAgendas[0]?.items ?? [];
  const upcomingDays = dayAgendas.slice(1);
  const isSubjectsEmpty = subjects.length === 0;
  const isScheduleEmpty = agenda.length === 0;

  return (
    <div className="flex flex-col gap-8">
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h1 className="heading">Matérias</h1>
          <div className="flex items-center gap-2">
            {hasStudyTemplates ? (
              <Link
                href="/templates"
                className="brutal-ghost btn-press px-2.5 py-1 detail font-medium text-fg3 [--ghost:#5b5b5b]"
              >
                Modelos
              </Link>
            ) : null}
            <NewSubjectButton className={`${isSubjectsEmpty && "border-primary text-primary"}`} />
          </div>
        </div>
        {!isSubjectsEmpty ? (
          <SubjectCarousel subjects={subjects} />
        ) : (
          <SubjectCallToAction showTemplates={hasStudyTemplates} />
        )}
      </section>

      {!isSubjectsEmpty && (
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="heading">Cronograma</h2>
            <Link href="/schedule" className="detail font-medium text-orange-700 underline underline-offset-2">
              Gerenciar
            </Link>
          </div>
          <div className="panel flex flex-col gap-2.5 p-2.5">
            <div className="flex items-center justify-between px-1">
              <span className="subtitle first-letter:uppercase">{formatDayLong(iso)}</span>
              {!isScheduleEmpty && (
                <Link
                  href="/timer"
                  className="brutal-ghost btn-press px-2.5 py-1 detail font-medium text-fg3 [--ghost:#5b5b5b]"
                >
                  Iniciar Estudos
                </Link>
              )}
            </div>
            <AgendaList
              items={agenda}
              reorder={{ kind: "day", dateISO: iso }}
              deleteMode="hold"
              tinted
              emptyText="Nenhum agendamento para hoje."
            />
          </div>

          <div className="mt-5 flex flex-col gap-3">
            <h3 className="subtitle">Próximos</h3>
            {upcomingDays.map((day) => (
              <div key={day.dateISO} className="panel flex flex-col gap-2.5 p-2.5 opacity-75">
                <div className="flex items-center justify-between px-1">
                  <span className="subtitle first-letter:uppercase">{formatDayLong(day.dateISO)}</span>
                </div>
                <AgendaList
                  items={day.items}
                  reorder={{ kind: "day", dateISO: day.dateISO }}
                  deleteMode="hold"
                  tinted
                  emptyText="Nenhum agendamento para este dia."
                />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function SubjectCallToAction({ showTemplates }: { showTemplates: boolean }) {
  return (
    <div className="panel flex flex-col items-center gap-3 px-4 py-8 text-center body text-fg3">
      <p>
        Nenhuma matéria ainda. Clique em <span className="font-medium text-fg1">&quot;Nova&quot;</span> para começar.
      </p>
      {showTemplates ? (
        <Link href="/templates" className="brutal-sm btn-press bg-orange-600 px-3 py-1.5 detail font-medium text-white">
          Explorar modelos
        </Link>
      ) : null}
    </div>
  );
}
