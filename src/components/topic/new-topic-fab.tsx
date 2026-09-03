"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/modal";
import { PlusIcon } from "@/components/icons";
import { createTopic } from "@/lib/actions/topics";
import { FIELD, LABEL, PRIMARY_BTN } from "@/components/ui";

export function NewTopicFab({ subjectId }: { subjectId: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(undefined);
    startTransition(async () => {
      const result = await createTopic(subjectId, name);
      if (result.ok) {
        setName("");
        setOpen(false);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Adicionar tópico"
        className="btn-press fixed bottom-6 right-5 z-20 grid h-11 w-11 place-items-center rounded-[8px] border border-ink bg-orange-600 text-white shadow-[2px_2px_0_0_#090909]"
      >
        <PlusIcon className="h-6 w-6" />
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Adicionar novo tópico">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
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
            {pending ? "Aguarde..." : "Criar"}
          </button>
        </form>
      </Modal>
    </>
  );
}
