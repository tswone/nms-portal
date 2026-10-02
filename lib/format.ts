import type { ISODate } from "./types";

// Parse "YYYY-MM-DD" as a local calendar date (new Date("2026-10-02") would be UTC midnight
// and can show as the previous day in US time zones).
export function parseISODate(date: ISODate): Date {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Days from today until an ISO date (negative = overdue, 0 = today). */
export function daysUntil(date: ISODate): number {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((parseISODate(date).getTime() - today.getTime()) / 86_400_000);
}

/** "Overdue by 5 days" / "Due today" / "Due in 3 days" */
export function formatDueLabel(date: ISODate): string {
  const days = daysUntil(date);
  if (days < 0) return `Overdue by ${-days} day${days === -1 ? "" : "s"}`;
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `Due in ${days} days`;
}

/** ISO datetime -> "Tue, Oct 6" */
export function formatDay(dateTime: string): string {
  return new Date(dateTime).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/** ISO datetime -> "4:30 PM" (viewer's local time) */
export function formatTime(dateTime: string): string {
  return new Date(dateTime).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

/** ISO datetime -> "Sep 24 at 4:12 PM" */
export function formatDateTime(dateTime: string): string {
  const d = new Date(dateTime);
  return `${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })} at ${formatTime(dateTime)}`;
}

/** "2026-10-02" -> "Oct 2, 2026" */
export function formatDate(date: ISODate): string {
  return parseISODate(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** "2026-06-21", "2026-07-03" -> "Jun 21 – Jul 3, 2026" */
export function formatDateRange(start: ISODate, end: ISODate): string {
  const s = parseISODate(start);
  const e = parseISODate(end);
  const sameYear = s.getFullYear() === e.getFullYear();
  const startStr = s.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  });
  return `${startStr} – ${formatDate(end)}`;
}

/** 5 -> "5th grade" */
export function formatGrade(grade: number): string {
  if (grade === 0) return "Kindergarten";
  const suffix =
    grade % 100 >= 11 && grade % 100 <= 13
      ? "th"
      : ({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[grade % 10] ?? "th";
  return `${grade}${suffix} grade`;
}

export function initials(...names: string[]): string {
  return names
    .map((n) => n.trim()[0] ?? "")
    .join("")
    .toUpperCase();
}
