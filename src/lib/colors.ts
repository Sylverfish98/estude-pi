export const DEFAULT_COLOR = "#C8762B";

export type ColorPreset = { name: string; value: string };

export const COLOR_PRESETS: ColorPreset[] = [
  { name: "Âmbar", value: "#C8762B" },
  { name: "Laranja", value: "#E79325" },
  { name: "Verde", value: "#6FBE3F" },
  { name: "Verde-escuro", value: "#3E7D34" },
  { name: "Azul", value: "#0057BC" },
  { name: "Azul-claro", value: "#4B9CD3" },
  { name: "Vermelho", value: "#D64541" },
  { name: "Rosa", value: "#E1799B" },
  { name: "Roxo", value: "#7E57C2" },
  { name: "Mostarda", value: "#C9A227" },
  { name: "Marrom", value: "#6B4A2B" },
  { name: "Cinza", value: "#6B6B66" },
];

const HEX_RE = /^#([0-9a-fA-F]{6})$/;

export function isValidHex(value: string): boolean {
  return HEX_RE.test(value.trim());
}

export function normalizeColor(value: string | null | undefined): string {
  if (value && isValidHex(value)) return value.trim().toUpperCase();
  return DEFAULT_COLOR;
}

/** Translucent tint of a subject color, for cronograma rows. */
export function tint(color: string, percent = 18): string {
  return `color-mix(in srgb, ${color} ${percent}%, transparent)`;
}
