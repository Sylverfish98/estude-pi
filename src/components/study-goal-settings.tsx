"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/modal";
import { SettingsIcon } from "@/components/icons";
import { FIELD, LABEL, PRIMARY_BTN } from "@/components/ui";
import { updateStudyGoal } from "@/lib/actions/study";

type Props = {
  initialGoalMinutes: number;
};

export function StudyGoalSettings({ initialGoalMinutes }: Props) {
  const [open, setOpen] = useState(false);
  const [goal, setGoal] = useState(String(initialGoalMinutes));
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(undefined);
    startTransition(async () => {
      const result = await updateStudyGoal(Number(goal));
      if (result.ok) setOpen(false);
      else setError(result.error);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Configurações da meta de estudo"
        className="brutal-sm btn-press grid h-8 w-8 place-items-center border-amber bg-cream text-amber shadow-amber"
      >
        <SettingsIcon className="h-4 w-4" />
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Configurações">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className={LABEL}>
            Meta de estudo diário (em minutos):
            <input
              type="number"
              min={1}
              max={1440}
              className={FIELD}
              value={goal}
              onChange={(event) => setGoal(event.target.value)}
              required
            />
          </label>
          {error ? <p className="detail font-medium text-danger">{error}</p> : null}
          <button type="submit" disabled={pending} className={PRIMARY_BTN}>
            {pending ? "Aguarde..." : "Salvar"}
          </button>
        </form>
      </Modal>
    </>
  );
}
