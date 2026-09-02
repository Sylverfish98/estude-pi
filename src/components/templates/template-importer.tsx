"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDownIcon, ExternalLinkIcon } from "@/components/icons";
import { Modal } from "@/components/modal";
import { FIELD, LABEL, PRIMARY_BTN } from "@/components/ui";
import { importStudyTemplate, type ImportTemplateInput, type ImportTemplateSummary } from "@/lib/actions/templates";
import { formatDMY, isValidISODate, todayISO } from "@/lib/dates";
import type { StudyTemplate, TemplateImportAvailability } from "@/lib/templates/catalog";
import type { ScheduleWeekday } from "@/lib/templates/auto-schedule";

type SelectionCounts = {
  subjects: number;
  newSubjects: number;
  mergedSubjects: number;
  topics: number;
  agendamentos: number;
};

type ScheduleSettings = NonNullable<ImportTemplateInput["autoSchedule"]>;

const WEEKDAY_OPTIONS: { key: ScheduleWeekday; label: string }[] = [
  { key: "sun", label: "Dom" },
  { key: "mon", label: "Seg" },
  { key: "tue", label: "Ter" },
  { key: "wed", label: "Qua" },
  { key: "thu", label: "Qui" },
  { key: "fri", label: "Sex" },
  { key: "sat", label: "Sáb" },
];

export function TemplateImporter({
  template,
  availability,
}: {
  template: StudyTemplate;
  availability: TemplateImportAvailability;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState<ImportTemplateSummary>();
  const [autoSchedule, setAutoSchedule] = useState(false);
  const [startDateISO, setStartDateISO] = useState(todayISO);
  const [itemsPerDay, setItemsPerDay] = useState("3");
  const [weekdays, setWeekdays] = useState<Set<ScheduleWeekday>>(() => new Set(["mon", "tue", "wed", "thu", "fri"]));
  const [countExisting, setCountExisting] = useState(true);
  const [pending, startTransition] = useTransition();

  const importableKeys = useMemo(
    () =>
      template.subjects.flatMap((subject) => {
        const existing = new Set(availability[subject.key]?.existingTopicKeys ?? []);
        return subject.topics
          .filter((topic) => !existing.has(topic.key))
          .map((topic) => selectionKey(subject.key, topic.key));
      }),
    [availability, template.subjects],
  );
  const counts = getSelectionCounts(template, availability, selected);
  const allSelected = importableKeys.length > 0 && importableKeys.every((key) => selected.has(key));
  const scheduleSettings: ScheduleSettings | undefined =
    autoSchedule && counts.topics > 0
      ? { startDateISO, itemsPerDay: Number(itemsPerDay), weekdays: [...weekdays], countExisting }
      : undefined;
  const scheduleValid =
    !scheduleSettings ||
    (isValidISODate(scheduleSettings.startDateISO) &&
      scheduleSettings.startDateISO >= todayISO() &&
      Number.isInteger(scheduleSettings.itemsPerDay) &&
      scheduleSettings.itemsPerDay >= 1 &&
      scheduleSettings.itemsPerDay <= 20 &&
      scheduleSettings.weekdays.length > 0);

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(importableKeys));
    setSuccess(undefined);
  }

  function toggleSubject(subject: StudyTemplate["subjects"][number]) {
    const existing = new Set(availability[subject.key]?.existingTopicKeys ?? []);
    const availableKeys = subject.topics
      .filter((topic) => !existing.has(topic.key))
      .map((topic) => selectionKey(subject.key, topic.key));
    const everySelected = availableKeys.every((key) => selected.has(key));
    setSelected((current) => {
      const next = new Set(current);
      availableKeys.forEach((key) => (everySelected ? next.delete(key) : next.add(key)));
      return next;
    });
    setSuccess(undefined);
  }

  function toggleTopic(subjectKey: string, topicKey: string) {
    const key = selectionKey(subjectKey, topicKey);
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
    setSuccess(undefined);
  }

  function toggleExpanded(key: string) {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleWeekday(weekday: ScheduleWeekday) {
    setWeekdays((current) => {
      const next = new Set(current);
      if (next.has(weekday)) next.delete(weekday);
      else next.add(weekday);
      return next;
    });
  }

  function handleImport() {
    setError(undefined);
    startTransition(async () => {
      const selections = template.subjects
        .map((subject) => ({
          subjectKey: subject.key,
          topicKeys: subject.topics
            .filter((topic) => selected.has(selectionKey(subject.key, topic.key)))
            .map((topic) => topic.key),
        }))
        .filter((selection) => selection.topicKeys.length > 0);
      const result = await importStudyTemplate({ templateId: template.id, selections, autoSchedule: scheduleSettings });
      if (!result.ok) {
        setError(result.error);
        setConfirming(false);
        return;
      }

      setSuccess(result.summary);
      setSelected(new Set());
      setAutoSchedule(false);
      setConfirming(false);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <label className="flex cursor-pointer items-center gap-2 detail font-medium text-fg2">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleAll}
            disabled={importableKeys.length === 0}
            className="h-4 w-4 accent-orange-600"
          />
          Selecionar tudo
        </label>
        <span className="detail text-fg3">{counts.topics} selecionados</span>
      </div>

      <div className="flex flex-col gap-3">
        {template.subjects.map((subject) => {
          const existingTopics = new Set(availability[subject.key]?.existingTopicKeys ?? []);
          const availableKeys = subject.topics
            .filter((topic) => !existingTopics.has(topic.key))
            .map((topic) => selectionKey(subject.key, topic.key));
          const selectedCount = availableKeys.filter((key) => selected.has(key)).length;
          const subjectChecked = availableKeys.length > 0 && selectedCount === availableKeys.length;
          const subjectIndeterminate = selectedCount > 0 && !subjectChecked;

          return (
            <section key={subject.key} className="panel overflow-hidden">
              <label className="flex cursor-pointer items-center gap-3 px-3 py-3">
                <IndeterminateCheckbox
                  checked={subjectChecked}
                  indeterminate={subjectIndeterminate}
                  disabled={availableKeys.length === 0}
                  onChange={() => toggleSubject(subject)}
                />
                <span
                  className="h-9 w-2 shrink-0 rounded-full border border-ink"
                  style={{ background: subject.color }}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate subtitle">{subject.name}</span>
                  <span className="block detail text-fg3">
                    {subject.topics.length} {subject.topics.length === 1 ? "tópico" : "tópicos"}
                  </span>
                </span>
              </label>

              <div className="flex flex-col border-t border-ink/10">
                {subject.topics.map((topic) => {
                  const key = selectionKey(subject.key, topic.key);
                  const isExisting = existingTopics.has(topic.key);
                  const isOpen = expanded.has(key);
                  return (
                    <div
                      key={topic.key}
                      className={`border-b border-ink/10 last:border-b-0 ${isExisting ? "opacity-55" : ""}`}
                    >
                      <div className="flex items-center gap-2 px-4 py-2.5">
                        <input
                          type="checkbox"
                          checked={!isExisting && selected.has(key)}
                          onChange={() => toggleTopic(subject.key, topic.key)}
                          disabled={isExisting}
                          aria-label={`Selecionar ${topic.name}`}
                          className="h-4 w-4 shrink-0 accent-orange-600"
                        />
                        <button
                          type="button"
                          onClick={() => toggleExpanded(key)}
                          aria-expanded={isOpen}
                          className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-left"
                        >
                          <span className="flex-1 truncate body text-fg1">{topic.name}</span>
                          {isExisting ? (
                            <span className="shrink-0 rounded-full bg-fg4/20 px-2 py-0.5 text-[11px] font-medium text-fg3">
                              Já importado
                            </span>
                          ) : null}
                          <span className="detail text-fg3">{topic.agendamentos.length}</span>
                          <ChevronDownIcon
                            className={`h-4 w-4 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
                          />
                        </button>
                      </div>

                      {isOpen ? (
                        <ul className="flex flex-col gap-1 px-4 pb-3 pl-12">
                          {topic.agendamentos.map((agendamento) => (
                            <li
                              key={agendamento.key}
                              className="flex items-center gap-2 rounded-[4px] bg-cream-card px-3 py-1.5 detail text-fg2"
                            >
                              <span className="flex-1">{agendamento.name}</span>
                              {agendamento.link ? (
                                <a
                                  href={agendamento.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  aria-label={`Abrir material sobre ${agendamento.name}`}
                                  className="shrink-0 cursor-pointer text-orange-700 hover:text-orange-600"
                                >
                                  <ExternalLinkIcon className="h-4 w-4" />
                                </a>
                              ) : null}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      <section className={`panel p-3 ${counts.topics === 0 ? "opacity-60" : ""}`}>
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={autoSchedule}
            onChange={(event) => setAutoSchedule(event.target.checked)}
            disabled={counts.topics === 0}
            className="mt-1 h-4 w-4 shrink-0 accent-orange-600"
          />
          <span>
            <span className="block body font-medium text-fg1">Agendar automaticamente todas as matérias</span>
            <span className="block detail text-fg3">
              Distribui os agendamentos dos tópicos selecionados alternando entre as matérias.
            </span>
          </span>
        </label>

        {autoSchedule && counts.topics > 0 ? (
          <div className="mt-4 flex flex-col gap-3 border-t border-ink/10 pt-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className={LABEL}>
                Início
                <input
                  type="date"
                  value={startDateISO}
                  min={todayISO()}
                  onChange={(event) => setStartDateISO(event.target.value)}
                  className={FIELD}
                  required
                />
              </label>
              <label className={LABEL}>
                Agendamentos por dia
                <input
                  type="number"
                  value={itemsPerDay}
                  min={1}
                  max={20}
                  step={1}
                  onChange={(event) => setItemsPerDay(event.target.value)}
                  className={FIELD}
                  required
                />
              </label>
            </div>

            <fieldset className="flex select-none flex-col gap-1">
              <legend className="detail text-fg3">Dias de estudo</legend>
              <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-7">
                {WEEKDAY_OPTIONS.map((weekday) => (
                  <label key={weekday.key} className="cursor-pointer">
                    <input
                      type="checkbox"
                      checked={weekdays.has(weekday.key)}
                      onChange={() => toggleWeekday(weekday.key)}
                      className="peer sr-only"
                    />
                    <span className="brutal-ghost block px-2 py-1 text-center detail text-fg3 peer-checked:bg-orange-600 peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-ring [--ghost:#5b5b5b]">
                      {weekday.label}
                    </span>
                  </label>
                ))}
              </div>
              {weekdays.size === 0 ? (
                <p className="detail font-medium text-danger">Selecione pelo menos um dia.</p>
              ) : null}
            </fieldset>

            <div className="py-2">
              <label className="flex cursor-pointer items-center gap-2 detail font-medium text-fg2">
                <input
                  type="checkbox"
                  checked={countExisting}
                  onChange={(event) => setCountExisting(event.target.checked)}
                  className="h-4 w-4 accent-orange-600"
                />
                Considerar agendamentos já marcados
              </label>
              <p className="mt-1 detail text-fg3">
                {countExisting
                  ? "Os agendamentos que já estão no calendário ocupam vagas do limite diário."
                  : "O limite diário vale somente para os novos agendamentos importados."}
              </p>
            </div>
          </div>
        ) : null}
      </section>

      {success ? <ImportSuccess summary={success} /> : null}
      {error ? <p className="detail font-medium text-danger">{error}</p> : null}
      <button
        type="button"
        disabled={counts.topics === 0 || pending || !scheduleValid}
        onClick={() => setConfirming(true)}
        className={PRIMARY_BTN}
      >
        Importar seleção
      </button>

      {confirming ? (
        <ImportConfirmation
          counts={counts}
          schedule={scheduleSettings}
          pending={pending}
          onClose={() => setConfirming(false)}
          onConfirm={handleImport}
        />
      ) : null}
    </div>
  );
}

function IndeterminateCheckbox({
  checked,
  indeterminate,
  disabled,
  onChange,
}: {
  checked: boolean;
  indeterminate: boolean;
  disabled: boolean;
  onChange: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      disabled={disabled}
      onChange={onChange}
      className="h-4 w-4 shrink-0 accent-orange-600"
    />
  );
}

function ImportConfirmation({
  counts,
  schedule,
  pending,
  onClose,
  onConfirm,
}: {
  counts: SelectionCounts;
  schedule?: ScheduleSettings;
  pending: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setCountdown((current) => {
        if (current <= 1) {
          window.clearInterval(interval);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <Modal open onClose={() => !pending && onClose()} title="Confirmar importação">
      <div className="flex flex-col gap-2 body text-fg2">
        <p>
          Você importará {counts.subjects} {counts.subjects === 1 ? "matéria" : "matérias"}, {counts.topics}{" "}
          {counts.topics === 1 ? "tópico" : "tópicos"} e {counts.agendamentos}{" "}
          {counts.agendamentos === 1 ? "agendamento" : "agendamentos"}.
        </p>
        <p className="detail text-fg3">
          {counts.newSubjects} novas · {counts.mergedSubjects} combinadas com matérias existentes
        </p>
        {schedule ? (
          <div className="rounded-[5px] bg-cream-card px-3 py-2 detail text-fg2">
            <p>
              Agendamento automático a partir de {formatDMY(schedule.startDateISO)}, com até {schedule.itemsPerDay} por
              dia.
            </p>
            <p className="mt-1 text-fg3">
              {schedule.weekdays
                .map((weekday) => WEEKDAY_OPTIONS.find((option) => option.key === weekday)?.label)
                .join(", ")}
              {schedule.countExisting ? " · Agendamentos existentes contam no limite" : " · Limite apenas para novos"}
            </p>
          </div>
        ) : (
          <p className="detail text-fg3">Os novos agendamentos ficarão sem data.</p>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onClose}
          disabled={pending}
          className="brutal-ghost btn-press py-1.5 detail font-medium text-fg3 disabled:opacity-60 [--ghost:#5b5b5b]"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={pending || countdown > 0}
          className="brutal-sm btn-press bg-orange-600 py-1.5 detail font-medium text-white disabled:opacity-60"
        >
          {pending ? "Aguarde..." : countdown > 0 ? `Confirmar em ${countdown}s` : "Confirmar importação"}
        </button>
      </div>
    </Modal>
  );
}

function ImportSuccess({ summary }: { summary: ImportTemplateSummary }) {
  return (
    <div
      className="rounded-[5px] border border-green-700/30 bg-green-100 px-3 py-2 detail text-green-800"
      role="status"
    >
      Importação concluída: {summary.subjectsCreated} novas matérias, {summary.subjectsMerged} matérias combinadas,{" "}
      {summary.topicsCreated} tópicos e {summary.agendamentosCreated} agendamentos criados
      {summary.agendamentosScheduled > 0 && summary.firstScheduledDateISO && summary.lastScheduledDateISO
        ? `, com ${summary.agendamentosScheduled} agendados entre ${formatDMY(summary.firstScheduledDateISO)} e ${formatDMY(summary.lastScheduledDateISO)}`
        : ""}
      {summary.topicsSkipped > 0 ? `, ${summary.topicsSkipped} tópicos ignorados por já existirem` : ""}.
    </div>
  );
}

function selectionKey(subjectKey: string, topicKey: string): string {
  return `${subjectKey}/${topicKey}`;
}

function getSelectionCounts(
  template: StudyTemplate,
  availability: TemplateImportAvailability,
  selected: Set<string>,
): SelectionCounts {
  return template.subjects.reduce<SelectionCounts>(
    (counts, subject) => {
      const selectedTopics = subject.topics.filter((topic) => selected.has(selectionKey(subject.key, topic.key)));
      if (selectedTopics.length === 0) return counts;
      counts.subjects += 1;
      if (availability[subject.key]?.existingSubject) counts.mergedSubjects += 1;
      else counts.newSubjects += 1;
      counts.topics += selectedTopics.length;
      counts.agendamentos += selectedTopics.reduce((total, topic) => total + topic.agendamentos.length, 0);
      return counts;
    },
    { subjects: 0, newSubjects: 0, mergedSubjects: 0, topics: 0, agendamentos: 0 },
  );
}
