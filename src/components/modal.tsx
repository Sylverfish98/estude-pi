"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { CloseIcon } from "@/components/icons";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
};

export function Modal({ open, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[4px] animate-fade-in" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="brutal relative w-full max-w-sm bg-cream p-4 gap-3 flex flex-col"
      >
        <div className="mb-3 flex items-center justify-between border-b border-muted">
          <h2 className="heading">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="-mr-1 -mt-1 rounded-md p-1 text-fg3 hover:text-fg1"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}
