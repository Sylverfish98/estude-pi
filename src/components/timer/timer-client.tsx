"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { Modal } from "@/components/modal";
import { CheckIcon, ChevronLeftIcon, SettingsIcon } from "@/components/icons";
import { toggleAgendamento } from "@/lib/actions/agendamentos";
import { recordStudyTime } from "@/lib/actions/study";
import { FIELD, LABEL, PRIMARY_BTN } from "@/components/ui";
import { SubHeader } from "@/components/sub-header";
import { todayISO } from "@/lib/dates";

type TimerItem = { id: string; name: string; isCompleted: boolean };
type Settings = { study: number; break: number };

const STORAGE_KEY = "estude_timer_settings";
const DEFAULT_SETTINGS: Settings = { study: 25, break: 5 };
const ARC_LEN = Math.PI * 90;

function mmss(total: number): string {
  const s = Math.max(0, total);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

type TimerClientProps = {
  initialItems: TimerItem[];
};

export function TimerClient({ initialItems }: TimerClientProps) {
  const [items, setItems] = useState(initialItems);
  const [syncedItems, setSyncedItems] = useState(initialItems);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [phase, setPhase] = useState<"study" | "break">("study");
  const [secondsLeft, setSecondsLeft] = useState(DEFAULT_SETTINGS.study * 60);
  const [running, setRunning] = useState(false);
  const [started, setStarted] = useState(false);
  const [cursor, setCursor] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [, startTransition] = useTransition();
  const pendingStudySecondsRef = useRef(0);

  // Re-sync with server truth without an effect.
  if (syncedItems !== initialItems) {
    setSyncedItems(initialItems);
    setItems(initialItems);
  }

  const secondsRef = useRef(secondsLeft);
  useEffect(() => {
    secondsRef.current = secondsLeft;
  }, [secondsLeft]);

  // Load persisted settings once on mount (external system read).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Settings;
      /* eslint-disable react-hooks/set-state-in-effect */
      setSettings(parsed);
      setSecondsLeft(parsed.study * 60);
      /* eslint-enable react-hooks/set-state-in-effect */
    } catch {
      // ignore malformed storage
    }
  }, []);

  // Single interval drives the countdown and flips study <-> break at zero.
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      const s = secondsRef.current;
      if (s > 0) {
        if (phase === "study") {
          pendingStudySecondsRef.current += 1;
          if (pendingStudySecondsRef.current >= 30) {
            const studiedSeconds = pendingStudySecondsRef.current;
            pendingStudySecondsRef.current = 0;
            void recordStudyTime(todayISO(), studiedSeconds);
          }
        }
        setSecondsLeft(s - 1);
        return;
      }
      const next = phase === "study" ? "break" : "study";
      setPhase(next);
      setSecondsLeft((next === "study" ? settings.study : settings.break) * 60);
    }, 1000);
    return () => clearInterval(id);
  }, [running, phase, settings]);

  useEffect(() => {
    return () => {
      const studiedSeconds = pendingStudySecondsRef.current;
      if (studiedSeconds > 0) {
        pendingStudySecondsRef.current = 0;
        void recordStudyTime(todayISO(), studiedSeconds);
      }
    };
  }, [running, phase]);

  const total = (phase === "study" ? settings.study : settings.break) * 60;
  const fraction = total > 0 ? secondsLeft / total : 0;

  const currentIndex = items.findIndex((it, idx) => idx >= cursor && !it.isCompleted);
  const current = currentIndex >= 0 ? items[currentIndex] : undefined;
  const isBreak = phase === "break";
  const isTimerPaused = isBreak || (started && !running);
  const label = isBreak ? "Pausa" : current ? current.name : "Tudo concluído!";

  function start() {
    if (!current) return;
    setStarted(true);
    setRunning(true);
  }

  function skip() {
    const nextPhase = isBreak ? "study" : "break";
    setPhase(nextPhase);
    setSecondsLeft((nextPhase === "study" ? settings.study : settings.break) * 60);
  }

  function complete(id: string) {
    const nextItems = items.map((item) => (item.id === id ? { ...item, isCompleted: !item.isCompleted } : item));
    setItems(nextItems);
    if (nextItems.every((item) => item.isCompleted)) setRunning(false);
    startTransition(() => void toggleAgendamento(id));
  }

  function saveSettings(next: Settings) {
    setSettings(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
    if (!started) setSecondsLeft(next.study * 60);
    setShowSettings(false);
  }

  return (
    <div
      className={`-mx-4 -mt-5 min-h-[calc(100vh-3.25rem)] px-4 pt-5 transition-colors duration-500`}
    >
      <SubHeader title="Sessão de Estudos">
        <button
          type="button"
          onClick={() => setShowSettings(true)}
          aria-label="Configurações"
          className="text-fg1 hover:text-fg1/70"
        >
          <SettingsIcon className="h-5 w-5" />
        </button>
      </SubHeader>

      <div className="flex flex-col items-center select-none">
        <div className="mb-4 grid w-64 grid-cols-2 rounded-[6px] border border-ink/20 bg-cream-card p-0.5 detail font-medium">
          <span
            className={`rounded-[4px] px-3 py-1 text-center transition-colors ${!isBreak ? "bg-orange-600 text-white" : "text-fg3"}`}
          >
            Bloco de estudo
          </span>
          <span
            className={`rounded-[4px] px-3 py-1 text-center transition-colors ${isBreak ? "bg-timer-pause text-timer-pause-foreground" : "text-fg3"}`}
          >
            Pausa
          </span>
        </div>
        <svg viewBox="0 0 200 116" className="w-64">
          <path
            d="M10,100 A90,90 0 0 1 190,100"
            fill="none"
            stroke="var(--color-timer-track)"
            strokeWidth={14}
            strokeLinecap="round"
          />
          <path
            d="M10,100 A90,90 0 0 1 190,100"
            fill="none"
            stroke={isTimerPaused ? "var(--color-timer-pause)" : "var(--color-timer-arc)"}
            strokeWidth={14}
            strokeLinecap="round"
            strokeDasharray={ARC_LEN}
            strokeDashoffset={ARC_LEN * (1 - fraction)}
          />
        </svg>
        <div className="-mt-10 text-center">
          <div className="font-display text-[35px] font-bold tabular-nums tracking-[-0.02em] text-fg1">
            {mmss(secondsLeft)}
          </div>
          <div className="mt-1 subtitle font-medium text-fg1">{label}</div>
        </div>

        <div className="mt-5 flex gap-2.5">
          {!started ? (
            <button
              type="button"
              onClick={start}
              disabled={!current}
              className="brutal-sm btn-press bg-orange-600 px-8 py-1.5 detail font-medium text-white disabled:opacity-50"
            >
              Iniciar
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setRunning((r) => !r)}
                disabled={!current}
                className="brutal-sm btn-press bg-timer-pause px-5 py-1.5 detail font-medium text-cream disabled:opacity-50"
              >
                {running ? "Pausar bloco" : "Retomar bloco"}
              </button>
              <button
                type="button"
                onClick={skip}
                className="brutal-sm btn-press bg-timer-skip px-5 py-1.5 detail font-medium text-cream"
              >
                Próximo bloco
              </button>
            </>
          )}
        </div>
      </div>

      <div className="mt-8 rounded-[10px] border border-ink/20 p-3">
        <h2 className="mb-2 body font-normal">Cronograma</h2>
        {items.length === 0 ? (
          <p className="py-4 text-center body text-fg3">Nenhum agendamento para hoje.</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {items.map((item) => {
              const isCurrent = item.id === current?.id;
              return (
                <li key={item.id} className="flex items-center gap-2 px-1 py-0.5">
                  <button
                    type="button"
                    onClick={() => complete(item.id)}
                    aria-label={item.isCompleted ? "Desmarcar" : "Concluir"}
                    aria-pressed={item.isCompleted}
                    className="grid h-[18px] w-[18px] shrink-0 place-items-center rounded-[2px] border border-ink bg-cream-card"
                  >
                    {item.isCompleted ? <CheckIcon className="h-3.5 w-3.5 text-fg1" /> : null}
                  </button>
                  <span
                    className={`${isCurrent ? "body font-medium" : "detail"} ${
                      item.isCompleted ? "text-fg3 line-through" : "text-fg1"
                    }`}
                  >
                    {item.name}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <Modal open={showSettings} onClose={() => setShowSettings(false)} title="Configurações">
        <SettingsForm settings={settings} onSave={saveSettings} />
      </Modal>
    </div>
  );
}

function SettingsForm({ settings, onSave }: { settings: Settings; onSave: (next: Settings) => void }) {
  const [study, setStudy] = useState(String(settings.study));
  const [brk, setBrk] = useState(String(settings.break));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const s = Math.min(180, Math.max(1, Number(study) || 25));
    const b = Math.min(60, Math.max(1, Number(brk) || 5));
    onSave({ study: s, break: b });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className={LABEL}>
        Duração do estudo (min)
        <input
          type="number"
          min={1}
          max={180}
          className={FIELD}
          value={study}
          onChange={(e) => setStudy(e.target.value)}
        />
      </label>
      <label className={LABEL}>
        Duração da pausa (min)
        <input type="number" min={1} max={60} className={FIELD} value={brk} onChange={(e) => setBrk(e.target.value)} />
      </label>
      <button type="submit" className={PRIMARY_BTN}>
        Salvar
      </button>
    </form>
  );
}
