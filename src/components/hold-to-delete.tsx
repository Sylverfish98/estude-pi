"use client";

import { useCallback, useRef, useState } from "react";
import { ConfirmationModal } from "@/components/confirmation-modal";

type HoldToDeleteProps = {
  onConfirm: () => void;
  durationMs?: number;
  confirmText?: string;
  className?: string;
  children: React.ReactNode;
};

export function HoldToDelete({
  onConfirm,
  durationMs = 650,
  confirmText = "Excluir este item?",
  className,
  children,
}: HoldToDeleteProps) {
  const [progress, setProgress] = useState(0);
  const [confirming, setConfirming] = useState(false);
  const rafRef = useRef<number | null>(null);
  const activeRef = useRef(false);

  const stop = useCallback(() => {
    activeRef.current = false;
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    setProgress(0);
  }, []);

  const begin = useCallback(
    (e: React.PointerEvent) => {
      if (e.button && e.button !== 0) return;
      activeRef.current = true;
      const startedAt = performance.now();
      const tick = (t: number) => {
        if (!activeRef.current) return;
        const p = Math.min(1, (t - startedAt) / durationMs);
        setProgress(p);
        if (p >= 1) {
          stop();
          setConfirming(true);
          return;
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    },
    [durationMs, stop],
  );

  return (
    <>
      <div
        className={className}
        style={{ position: "relative", touchAction: "pan-y" }}
        onPointerDown={begin}
        onPointerUp={stop}
        onPointerLeave={stop}
        onPointerCancel={stop}
      >
        {children}
        {progress > 0 ? (
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "inherit",
              pointerEvents: "none",
              background: `color-mix(in srgb, var(--color-danger) ${Math.round(progress * 40)}%, transparent)`,
            }}
          />
        ) : null}
      </div>
      <ConfirmationModal
        open={confirming}
        description={confirmText}
        onConfirm={() => {
          setConfirming(false);
          onConfirm();
        }}
        onClose={() => setConfirming(false)}
      />
    </>
  );
}
