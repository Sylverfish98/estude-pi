"use client";

import { useState } from "react";
import { Modal } from "@/components/modal";
import {
  AgendamentoForm,
  type AgendamentoMode,
  type SubjectWithTopics,
} from "@/components/agendamento/agendamento-form";

type Props = {
  subjects: SubjectWithTopics[];
  defaultDateISO: string;
};

export function NewAgendamentoButton({ subjects, defaultDateISO }: Props) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<AgendamentoMode>("create");
  const disabled = subjects.length === 0;

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setMode("create");
          setOpen(true);
        }}
        disabled={disabled}
        className="brutal-ghost btn-press inline-flex items-center px-2 py-0.5 detail font-medium text-fg3 disabled:opacity-50 [--ghost:#5b5b5b]"
      >
        Agendar
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={mode === "existing" ? "Agendar Existente" : "Novo Agendamento"}
      >
        <AgendamentoForm
          subjects={subjects}
          defaultDateISO={defaultDateISO}
          onModeChange={setMode}
          onDone={() => setOpen(false)}
        />
      </Modal>
    </>
  );
}
