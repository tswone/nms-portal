// Money is stored as integer cents everywhere; convert to dollars only for display.

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

/** 307639 -> "$3,076.39" */
export function formatCents(cents: number): string {
  return usd.format(cents / 100);
}

/** Whole-number percent of a cents total, clamped to 0–100 (for progress bars). */
export function percentOf(partCents: number, totalCents: number): number {
  if (totalCents <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((partCents / totalCents) * 100)));
}
