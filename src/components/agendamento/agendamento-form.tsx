"use client";

import { useMemo, useState, useTransition } from "react";
import { createAgendamento, scheduleAgendamento } from "@/lib/actions/agendamentos";
import { FIELD, LABEL, PRIMARY_BTN } from "@/components/ui";

export type SubjectWithTopics = {
  id: string;
  name: string;
  topics: {
    id: string;
    name: string;
    agendamentos: { id: string; name: string }[];
  }[];
};

export type AgendamentoMode = "create" | "existing";

type AgendamentoFormProps = {
  onDone: () => void;
  /** Topic-scoped mode: creates within this topic, no subject/topic selects. */
  fixedTopicId?: string;
  /** Full mode: cascading subject -> topic selects. */
  subjects?: SubjectWithTopics[];
  defaultDateISO?: string;
  onModeChange?: (mode: AgendamentoMode) => void;
};

export function AgendamentoForm({
  onDone,
  fixedTopicId,
  subjects,
  defaultDateISO,
  onModeChange,
}: AgendamentoFormProps) {
  const firstSubject = subjects?.[0];
  const firstTopic = firstSubject?.topics[0];
  const [mode, setMode] = useState<AgendamentoMode>("create");
  const [name, setName] = useState("");
  const [link, setLink] = useState("");
  const [dateISO, setDateISO] = useState(defaultDateISO ?? "");
  const [subjectId, setSubjectId] = useState(firstSubject?.id ?? "");
  const [topicId, setTopicId] = useState(fixedTopicId ?? firstTopic?.id ?? "");
  const [topicName, setTopicName] = useState("");
  const [existingId, setExistingId] = useState(firstTopic?.agendamentos[0]?.id ?? "");
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();

  const topics = useMemo(() => subjects?.find((s) => s.id === subjectId)?.topics ?? [], [subjects, subjectId]);
  const existingItems = useMemo(
    () => topics.find((topic) => topic.id === topicId)?.agendamentos ?? [],
    [topics, topicId],
  );

  function handleModeChange(nextMode: AgendamentoMode) {
    setMode(nextMode);
    onModeChange?.(nextMode);
  }

  function handleSubjectChange(nextSubjectId: string) {
    setSubjectId(nextSubjectId);
    const nextTopics = subjects?.find((s) => s.id === nextSubjectId)?.topics ?? [];
    const nextTopic = nextTopics[0];
    setTopicId(nextTopic?.id ?? "");
    setExistingId(nextTopic?.agendamentos[0]?.id ?? "");
    setTopicName("");
    if (nextTopics.length === 0) handleModeChange("create");
  }

  function handleTopicChange(nextTopicId: string) {
    setTopicId(nextTopicId);
    const nextTopic = topics.find((topic) => topic.id === nextTopicId);
    setExistingId(nextTopic?.agendamentos[0]?.id ?? "");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(undefined);
    startTransition(async () => {
      const result =
        subjects && mode === "existing"
          ? await scheduleAgendamento(existingId, dateISO)
          : await createAgendamento({
              topicId: (fixedTopicId ?? topicId) || undefined,
              subjectId: topics.length === 0 ? subjectId : undefined,
              topicName: topics.length === 0 ? topicName : undefined,
              name,
              link,
              dateISO,
            });
      if (result.ok) onDone();
      else setError(result.error);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      {subjects && (
        <>
          <label className={LABEL}>
            Matéria
            <select className={FIELD} value={subjectId} onChange={(e) => handleSubjectChange(e.target.value)}>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>

          <label className={LABEL}>
            Nome do Tópico
            {topics.length === 0 ? (
              <input
                className={FIELD}
                value={topicName}
                onChange={(event) => setTopicName(event.target.value)}
                maxLength={120}
                required
              />
            ) : (
              <select className={FIELD} value={topicId} onChange={(event) => handleTopicChange(event.target.value)}>
                {topics.map((topic) => (
                  <option key={topic.id} value={topic.id}>
                    {topic.name}
                  </option>
                ))}
              </select>
            )}
          </label>
        </>
      )}

      <div className="bg-muted panel p-2 rounded-md mb-4">
        <div className="grid grid-cols-2 rounded-full border border-field-border bg-muted p-0.5 detail font-medium mb-2">
          <button
            type="button"
            onClick={() => handleModeChange("create")}
            className={`text-nowrap cursor-pointer rounded-full px-3 py-0.75 transition-colors ${mode === "create" ? "bg-orange-600 text-white" : "text-fg3"}`}
          >
            Criar novo
          </button>
          <button
            type="button"
            onClick={() => handleModeChange("existing")}
            disabled={topics.length === 0}
            className={`text-nowrap cursor-pointer rounded-full px-3 py-0.75 transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${mode === "existing" ? "bg-orange-600 text-white" : "text-fg3"}`}
          >
            Já existente
          </button>
        </div>

        {mode === "existing" ? (
          <label className={LABEL}>
            Agendamento
            <select
              className={FIELD}
              value={existingId}
              onChange={(event) => setExistingId(event.target.value)}
              required
            >
              {existingItems.length === 0 ? <option value="">— sem agendamentos —</option> : null}
              {existingItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {!subjects || mode === "create" ? (
          <>
            <label className={LABEL}>
              Nome do agendamento
              <input
                className={FIELD}
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={120}
                autoFocus
                required
              />
            </label>

            <label className={LABEL}>
              Link (opcional)
              <input
                className={FIELD}
                value={link}
                onChange={(e) => setLink(e.target.value)}
                inputMode="url"
                placeholder="https://..."
              />
            </label>
          </>
        ) : null}
      </div>

      <label className={LABEL}>
        {subjects ? "Data" : "Data (opcional)"}
        <input
          type="date"
          className={FIELD}
          value={dateISO}
          onChange={(e) => setDateISO(e.target.value)}
          required={Boolean(subjects)}
        />
      </label>

      {error ? <p className="detail font-medium text-danger">{error}</p> : null}

      <button type="submit" disabled={pending} className={PRIMARY_BTN}>
        {pending ? "Aguarde..." : mode === "existing" ? "Agendar" : "Criar"}
      </button>
    </form>
  );
}
