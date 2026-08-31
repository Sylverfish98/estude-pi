"use client";

import { Modal } from "@/components/modal";

type Props = {
  open: boolean;
  title?: string;
  description: string;
  confirmLabel?: string;
  pending?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export function ConfirmationModal({
  open,
  title = "Confirmar exclusão",
  description,
  confirmLabel = "Excluir",
  pending = false,
  onConfirm,
  onClose,
}: Props) {
  return (
    <Modal open={open} onClose={() => !pending && onClose()} title={title}>
      <p className="body text-fg2">{description}</p>
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
          disabled={pending}
          className="brutal-sm btn-press bg-danger py-1.5 detail font-medium text-white disabled:opacity-60"
        >
          {pending ? "Aguarde..." : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
