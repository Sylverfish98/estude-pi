export const WEEKDAYS_PT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"] as const;

export const MONTHS_PT = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
] as const;

const pad = (n: number) => String(n).padStart(2, "0");

/** `YYYY-MM-DD` string is the canonical identity of a calendar day. */
export function isoToDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/** A stored `Date` (UTC midnight) back to `YYYY-MM-DD`. */
export function dateToISO(date: Date): string {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

export function isValidISODate(iso: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) && dateToISO(isoToDate(iso)) === iso;
}

export function addDaysISO(iso: string, days: number): string {
  const date = isoToDate(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return dateToISO(date);
}

export function weekdayOfISO(iso: string): number {
  return isoToDate(iso).getUTCDay();
}

/** Local calendar day as `YYYY-MM-DD`. */
export function todayISO(): string {
  const n = new Date();
  return `${n.getFullYear()}-${pad(n.getMonth() + 1)}-${pad(n.getDate())}`;
}

/** Half-open `[start, end)` UTC range covering one ISO day, for DB queries. */
export function dayRange(iso: string): { start: Date; end: Date } {
  const start = isoToDate(iso);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

/** e.g. `Março 2026` from a year and 0-based month. */
export function formatMonthYear(year: number, month: number): string {
  return `${MONTHS_PT[month]} ${year}`;
}

/** e.g. `09 de março` from an ISO day string. */
export function formatDayLong(iso: string): string {
  const d = isoToDate(iso);
  return `${pad(d.getUTCDate())} de ${MONTHS_PT[d.getUTCMonth()].toLowerCase()}`;
}

/** e.g. `09/03/2026` from an ISO day string. */
export function formatDMY(iso: string): string {
  const d = isoToDate(iso);
  return `${pad(d.getUTCDate())}/${pad(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}`;
}
