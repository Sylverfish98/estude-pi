"use client";

import { useState } from "react";
import { COLOR_PRESETS, isValidHex } from "@/lib/colors";

type ColorPickerProps = {
  value: string;
  onChange: (value: string) => void;
};

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const matchesPreset = COLOR_PRESETS.some((p) => p.value.toUpperCase() === value.toUpperCase());
  const [customOpen, setCustomOpen] = useState(!matchesPreset);

  return (
    <div>
      <div className="grid grid-cols-6 w-full gap-2 content-between">
        {COLOR_PRESETS.map((preset) => {
          const selected = !customOpen && preset.value.toUpperCase() === value.toUpperCase();
          return (
            <button
              key={preset.value}
              type="button"
              title={preset.name}
              aria-label={preset.name}
              aria-pressed={selected}
              onClick={() => {
                setCustomOpen(false);
                onChange(preset.value);
              }}
              className="h-7 w-7 rounded-lg border-2 border-fg2 transition-transform"
              style={{
                background: preset.value,
                transform: selected ? "scale(1.18)" : "none",
                boxShadow: selected ? "0 0 0 2px var(--color-ring)" : "none",
              }}
            />
          );
        })}
        <button
          type="button"
          title="Cor personalizada"
          aria-label="Cor personalizada"
          onClick={() => setCustomOpen(true)}
          className="grid h-7 w-7 place-items-center rounded-full border-2 border-dashed border-ink text-fg3"
        >
          +
        </button>
      </div>

      {customOpen ? (
        <div className="mt-3 flex items-center gap-2">
          <input
            type="color"
            value={isValidHex(value) ? value : "#C8762B"}
            onChange={(e) => onChange(e.target.value.toUpperCase())}
            className="h-9 w-12 rounded border border-ink bg-transparent p-0.5"
            aria-label="Selecionar cor"
          />
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="#RRGGBB"
            maxLength={7}
            className="w-full rounded-lg bg-field px-3 py-2 outline-none focus:ring-4 focus:ring-ring"
          />
        </div>
      ) : null}
    </div>
  );
}
