"use client";

import { useState, useTransition } from "react";
import { ColorPicker } from "@/components/subject/color-picker";
import { DEFAULT_COLOR } from "@/lib/colors";
import { FIELD, LABEL, PRIMARY_BTN } from "@/components/ui";

type ActionResult = { ok: true } | { ok: false; error: string };

type SubjectFormProps = {
  initialName?: string;
  initialColor?: string;
  initialVisibility?: boolean;
  submitLabel: string;
  onSubmit: (name: string, color: string, isPublic: boolean) => Promise<ActionResult>;
  onDone: () => void;
};

export function SubjectForm({
  initialName = "",
  initialColor = DEFAULT_COLOR,
  initialVisibility = false,
  submitLabel,
  onSubmit,
  onDone,
}: SubjectFormProps) {
  const [name, setName] = useState(initialName);
  const [color, setColor] = useState(initialColor);
  const [isPublic, setIsPublic] = useState<boolean>(initialVisibility);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(undefined);
    startTransition(async () => {
      const result = await onSubmit(name, color, isPublic);
      if (result.ok) onDone();
      else setError(result.error);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <label className={LABEL}>
        Nome da matéria
        <input
          className={FIELD}
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={25}
          autoFocus
          required
        />
      </label>

      <div className="flex flex-col gap-2 detail text-fg3">
        Cor da matéria
        <ColorPicker value={color} onChange={setColor} />
      </div>

      <div className="flex flex-col gap-2 detail text-fg3">
        Visibilidade da matéria
        <div className="flex justify-between select-none">
          Permitir que outros acessem essa matéria
          <label>
            <div
              className={`relative w-10 h-5 border rounded-full cursor-pointer ${
                isPublic ? "bg-danger/80 border-0" : "bg-field rounded-full border-field-border"
              }`}
              onClick={() => setIsPublic((v) => !v)}
            >
              <input className="hidden" checked={isPublic} type="checkbox" onChange={() => setIsPublic((v) => !v)} />
              <span
                className={`rounded-full top-1/2 -translate-y-1/2 left-0.5 absolute w-4 h-4 transition ${isPublic ? "bg-white translate-x-4.75" : "bg-field-border translate-x-0"}`}
              ></span>
            </div>
          </label>
        </div>
        {isPublic && (
          <p className="detail font-medium text-danger">Qualquer pessoa com o link poderá ver essa matéria!</p>
        )}
      </div>

      {error ? <p className="detail font-medium text-danger">{error}</p> : null}

      <button type="submit" disabled={pending} className={PRIMARY_BTN}>
        {pending ? "Aguarde..." : submitLabel}
      </button>
    </form>
  );
}
