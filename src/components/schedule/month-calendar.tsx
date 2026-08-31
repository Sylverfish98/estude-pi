"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MONTHS_PT, WEEKDAYS_PT, todayISO } from "@/lib/dates";
import { CheckIcon, ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";
import type { StudyDaySummary } from "@/lib/data";

const pad = (n: number) => String(n).padStart(2, "0");

type Props = {
  selectedISO: string;
  studyDays: StudyDaySummary[];
  dailyGoalMinutes: number;
};

export function MonthCalendar({ selectedISO, studyDays, dailyGoalMinutes }: Props) {
  const router = useRouter();
  const [year, setYear] = useState(() => Number(selectedISO.slice(0, 4)));
  const [month, setMonth] = useState(() => Number(selectedISO.slice(5, 7)) - 1);
  const today = todayISO();
  const studiedSecondsByDay = new Map(studyDays.map((day) => [day.dateISO, day.studiedSeconds]));

  const firstWeekday = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

  function changeMonth(delta: number) {
    const d = new Date(Date.UTC(year, month + delta, 1));
    setYear(d.getUTCFullYear());
    setMonth(d.getUTCMonth());
  }

  function selectDay(day: number) {
    const iso = `${year}-${pad(month + 1)}-${pad(day)}`;
    router.replace(`/schedule?date=${iso}`, { scroll: false });
  }

  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="px-1 py-2 w-full flex flex-col items-center">
      <div className="mb-2 flex items-center w-full max-w-[300px] justify-center gap-6 px-1">
        <button
          type="button"
          onClick={() => changeMonth(-1)}
          aria-label="Mês anterior"
          className="text-fg2 flex-center h-6 w-8 rounded-sm hover:bg-cream-card"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </button>
        <span className="font-display body font-bold w-full text-center">
          {MONTHS_PT[month]} {year}
        </span>
        <button
          type="button"
          onClick={() => changeMonth(1)}
          aria-label="Próximo mês"
          className="text-fg2 flex-center h-6 w-8 rounded-sm hover:bg-cream-card"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="grid max-w-[300px] w-full grid-cols-7 gap-1 text-center detail text-fg3">
        {WEEKDAYS_PT.map((w) => (
          <span key={w} className="py-1 min-w-6">
            {w}
          </span>
        ))}
      </div>

      <div className="grid max-w-[300px] w-full grid-cols-7 grid-rows-6 gap-1 text-center body">
        {cells.map((day, idx) => {
          if (day === null) return <span key={`e${idx}`} />;
          const iso = `${year}-${pad(month + 1)}-${pad(day)}`;
          const isSelected = iso === selectedISO;
          const isToday = iso === today;
          const metGoal = (studiedSecondsByDay.get(iso) ?? 0) >= dailyGoalMinutes * 60;
          return (
            <button
              key={iso}
              type="button"
              onClick={() => selectDay(day)}
              className={`relative aspect-square min-w-6 rounded-md transition-colors ${
                isSelected
                  ? "bg-orange-600 font-semibold text-white"
                  : isToday
                    ? "ring-2 ring-orange text-fg1"
                    : "text-fg2 hover:bg-cream-card"
              }`}
            >
              {day}
              {metGoal ? (
                <CheckIcon
                  className={`absolute right-0 top-0 h-2.5 w-2.5 ${isSelected ? "text-white" : "text-green-700"}`}
                />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
