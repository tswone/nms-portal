import { daysUntil } from "./format";
import type { ChecklistItem } from "./types";

export const ACTION_WINDOW_DAYS = 14;

/** Required, not done, and overdue or due within ACTION_WINDOW_DAYS — what we nudge about. */
export function needsAction(item: ChecklistItem): boolean {
  return item.required && !item.isDone && daysUntil(item.dueDate) <= ACTION_WINDOW_DAYS;
}

export function isOverdue(item: ChecklistItem): boolean {
  return !item.isDone && daysUntil(item.dueDate) < 0;
}
