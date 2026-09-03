"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/modal";
import { AgendaList, type AgendaItem } from "@/components/agenda-list";
import { AgendamentoForm } from "@/components/agendamento/agendamento-form";
import { ChevronDownIcon, PencilIcon } from "@/components/icons";
import { updateTopic, deleteTopic } from "@/lib/actions/topics";
import { FIELD, LABEL, PRIMARY_BTN } from "@/components/ui";
import { ConfirmationModal } from "@/components/confirmation-modal";

type TopicAccordionProps = {
  topic: { id: string; name: string };
  agendamentos: AgendaItem[];
  isOwner: boolean;
  defaultOpen?: boolean;
  dragHandle?: (handleClick: () => void) => React.ReactNode | null;
};

export function TopicAccordion({ topic, agendamentos, defaultOpen = false, isOwner, dragHandle }: TopicAccordionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deletePending, startDeleteTransition] = useTransition();

  function handleDelete() {
    startDeleteTransition(async () => {
      await deleteTopic(topic.id);
      setConfirmingDelete(false);
    });
  }

  return (
    <div className="panel w-full">
      <div className="flex items-center w-full gap-1 px-2.5 py-2">
        <div
          onClick={() => setOpen((v) => !v)}
          className="flex w-full cursor-pointer items-center justify-between gap-2 text-left"
          aria-expanded={open}
        >
          {dragHandle && dragHandle(() => setOpen(false))}

          <span className="subtitle select-none text-fg1 overflow-hidden text-ellipsis flex items-center gap-1 flex-1">
            {topic.name}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setEditing(true);
              }}
              aria-label="Editar tópico"
              className="h-4 w-4 cursor-pointer text-fg4 hover:text-fg1"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
          </span>

          <div className="flex items-center gap-2">
            {isOwner && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setAdding(true);
                  }}
                  className="brutal-ghost btn-press inline-flex cursor-pointer items-center px-2 py-0.5 detail font-medium text-fg3 [--ghost:#5b5b5b]"
                >
                  Adicionar
                </button>
              </>
            )}
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setOpen((value) => !value);
              }}
              aria-label={open ? "Recolher" : "Expandir"}
              className="h-5 w-5 cursor-pointer text-fg1"
            >
              <ChevronDownIcon className={`h-5 w-5 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {open ? (
        <div className="px-1 pb-2">
          <AgendaList
            isOwner={isOwner}
            items={agendamentos}
            reorder={{ kind: "topic", topicId: topic.id }}
            editable={isOwner}
            deleteMode="hold"
            emptyText="Nenhum agendamento neste tópico."
          />
        </div>
      ) : null}

      <Modal open={adding} onClose={() => setAdding(false)} title="Novo Agendamento">
        <AgendamentoForm fixedTopicId={topic.id} onDone={() => setAdding(false)} />
      </Modal>

      <TopicEditModal
        open={editing}
        onClose={() => setEditing(false)}
        onRequestDelete={() => {
          setEditing(false);
          setConfirmingDelete(true);
        }}
        topic={topic}
      />

      <ConfirmationModal
        open={confirmingDelete}
        description={`Excluir o tópico "${topic.name}" e seus agendamentos?`}
        pending={deletePending}
        onConfirm={handleDelete}
        onClose={() => setConfirmingDelete(false)}
      />
    </div>
  );
}

function TopicEditModal({
  open,
  onClose,
  onRequestDelete,
  topic,
}: {
  open: boolean;
  onClose: () => void;
  onRequestDelete: () => void;
  topic: { id: string; name: string };
}) {
  const [name, setName] = useState(topic.name);
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(undefined);
    startTransition(async () => {
      const result = await updateTopic(topic.id, name);
      if (result.ok) onClose();
      else setError(result.error);
    });
  }

  return (
    <Modal open={open} onClose={onClose} title="Editar Tópico">
      <form onSubmit={handleSave} className="flex flex-col gap-3">
        <label className={LABEL}>
          Nome do tópico
          <input
            className={FIELD}
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={120}
            autoFocus
            required
          />
        </label>
        {error ? <p className="detail font-medium text-danger">{error}</p> : null}
        <button type="submit" disabled={pending} className={PRIMARY_BTN}>
          {pending ? "Aguarde..." : "Salvar"}
        </button>
        <button
          type="button"
          onClick={onRequestDelete}
          disabled={pending}
          className="detail font-medium text-danger underline underline-offset-2"
        >
          Excluir tópico
        </button>
      </form>
    </Modal>
  );
}
