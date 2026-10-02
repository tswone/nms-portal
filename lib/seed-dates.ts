// The seed data is written as if "today" were SEED_ANCHOR. To keep the demo current, every
// date is shifted by the whole weeks between the anchor and the real today — whole weeks so
// weekday events stay on the same weekday and "due in N days" reads the same.

export const SEED_ANCHOR = "2026-10-02";

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;
const DAY_MS = 86_400_000;

/** Whole-week offset (in days) from the seed anchor to `today`. */
export function seedOffsetDays(today: Date = new Date()): number {
  const [y, m, d] = SEED_ANCHOR.split("-").map(Number);
  const anchor = new Date(y, m - 1, d).getTime();
  const local = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  return Math.round((local - anchor) / DAY_MS / 7) * 7;
}

function shiftDate(value: string, days: number): string {
  const [y, m, d] = value.split("-").map(Number);
  const shifted = new Date(y, m - 1, d + days);
  const mm = String(shifted.getMonth() + 1).padStart(2, "0");
  const dd = String(shifted.getDate()).padStart(2, "0");
  return `${shifted.getFullYear()}-${mm}-${dd}`;
}

/** Returns a copy of `data` with every ISO date / datetime string moved by `days`. */
export function shiftDates<T>(data: T, days: number): T {
  if (days === 0) return data;
  const walk = (value: unknown): unknown => {
    if (typeof value === "string") {
      if (DATE_ONLY.test(value)) return shiftDate(value, days);
      if (DATE_TIME.test(value)) return new Date(new Date(value).getTime() + days * DAY_MS).toISOString();
      return value;
    }
    if (Array.isArray(value)) return value.map(walk);
    if (value && typeof value === "object") {
      return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, walk(v)]));
    }
    return value;
  };
  return walk(data) as T;
}
