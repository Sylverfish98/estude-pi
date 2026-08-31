"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/modal";
import { FIELD, LABEL, PRIMARY_BTN } from "@/components/ui";
import { deleteAgendamento, updateAgendamento } from "@/lib/actions/agendamentos";

type EditableItem = {
  id: string;
  name: string;
  link: string | null;
  dateISO?: string | null;
};

export type AgendamentoEditValues = {
  name: string;
  link: string | null;
  dateISO: string | null;
};

type Props = {
  item: EditableItem;
  onClose: () => void;
  onSaved: (values: AgendamentoEditValues) => void;
  onDeleted: () => void;
};

export function AgendamentoEditModal({ item, onClose, onSaved, onDeleted }: Props) {
  const [name, setName] = useState(item.name);
  const [link, setLink] = useState(item.link ?? "");
  const [dateISO, setDateISO] = useState(item.dateISO ?? "");
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function handleSave(event: React.FormEvent) {
    event.preventDefault();
    setError(undefined);
    startTransition(async () => {
      const result = await updateAgendamento(item.id, { name, link, dateISO });
      if (result.ok) {
        onSaved({
          name: name.trim(),
          link: link.trim() || null,
          dateISO: dateISO || null,
        });
      } else {
        setError(result.error);
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteAgendamento(item.id);
      onDeleted();
    });
  }

  return (
    <Modal open onClose={onClose} title="Editar Agendamento">
      <form onSubmit={handleSave} className="flex flex-col gap-3">
        <label className={LABEL}>
          Nome do agendamento
          <input
            className={FIELD}
            value={name}
            onChange={(event) => setName(event.target.value)}
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
            onChange={(event) => setLink(event.target.value)}
            inputMode="url"
            placeholder="https://..."
          />
        </label>
        <label className={LABEL}>
          Data (opcional)
          <input type="date" className={FIELD} value={dateISO} onChange={(event) => setDateISO(event.target.value)} />
        </label>
        {error ? <p className="detail font-medium text-danger">{error}</p> : null}
        <button type="submit" disabled={pending} className={PRIMARY_BTN}>
          {pending ? "Aguarde..." : "Salvar"}
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={pending}
          className="detail font-medium text-danger underline underline-offset-2 disabled:opacity-60"
        >
          Excluir agendamento
        </button>
      </form>
    </Modal>
  );
}
