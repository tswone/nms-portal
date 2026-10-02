// Mock data service. Every function is async and adds a little latency so the UI
// gets built against the same shape as a real API (Zoho CRM, Ramp/QuickBooks).
// Writes persist to localStorage in the browser; on the server the seed data is used.

import { needsAction } from "./checklist";
import {
  seedBudget,
  seedChecklist,
  seedEvents,
  seedFamily,
  seedFollowUps,
  seedMeetings,
  seedMentors,
  seedMessages,
  seedPins,
  seedProgress,
  seedVisit,
} from "./seed";
import type {
  Address,
  Budget,
  BudgetCategory,
  BudgetSummary,
  ChecklistItem,
  Family,
  Mentor,
  MentorMeeting,
  MentorMessage,
  MentorSlot,
  Parent,
  Pin,
  PortalEvent,
  PortalFeedback,
  StaffFollowUp,
  Star,
  StarProgress,
  VisitInfo,
} from "./types";

interface Db {
  family: Family;
  progress: StarProgress[];
  budget: Budget;
  checklist: ChecklistItem[];
  mentors: Mentor[];
  meetings: MentorMeeting[];
  messages: MentorMessage[];
  followUps: StaffFollowUp[];
  events: PortalEvent[];
  pins: Pin[];
  visit: VisitInfo;
  feedback: PortalFeedback[];
}

const STORAGE_KEY = "nms-portal:db:v10"; // bumped when the stored shape changes

const clone = <T>(value: T): T => structuredClone(value);

const seedDb = (): Db =>
  clone({
    family: seedFamily,
    progress: seedProgress,
    budget: seedBudget,
    checklist: seedChecklist,
    mentors: seedMentors,
    meetings: seedMeetings,
    messages: seedMessages,
    followUps: seedFollowUps,
    events: seedEvents,
    pins: seedPins,
    visit: seedVisit,
    feedback: [],
  });

let db: Db | null = null;

function getDb(): Db {
  if (db) return db;
  db = seedDb();
  if (typeof window !== "undefined") {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) db = JSON.parse(stored) as Db;
    } catch {
      // Corrupt or blocked storage: fall back to seed data.
    }
  }
  return db;
}

function persist() {
  if (typeof window === "undefined" || !db) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    // Storage full or blocked: keep the in-memory copy.
  }
}

// Simulated network round-trip.
function respond<T>(value: T, ms = 250 + Math.random() * 300): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(clone(value)), ms));
}

function fail(message: string, ms = 200): Promise<never> {
  return new Promise((_, reject) => setTimeout(() => reject(new Error(message)), ms));
}

// Local calendar date (en-CA formats as YYYY-MM-DD).
const todayISO = () => new Date().toLocaleDateString("en-CA");

// --- Family / basic info ---

export function getFamily(): Promise<Family> {
  return respond(getDb().family);
}

export function updateAddress(patch: Partial<Address>): Promise<Family> {
  const { family } = getDb();
  family.address = { ...family.address, ...patch };
  persist();
  return respond(family);
}

export function updateParent(
  parentId: string,
  patch: Partial<Omit<Parent, "id">>,
): Promise<Parent> {
  const parent = getDb().family.parents.find((p) => p.id === parentId);
  if (!parent) return fail(`Parent ${parentId} not found`);
  Object.assign(parent, patch);
  persist();
  return respond(parent);
}

export function updateStar(
  starId: string,
  patch: Partial<Omit<Star, "id">>,
): Promise<Star> {
  const star = getDb().family.stars.find((s) => s.id === starId);
  if (!star) return fail(`Star ${starId} not found`);
  Object.assign(star, patch);
  persist();
  return respond(star);
}

// --- Progress / history ---

export function getStarProgress(starId: string): Promise<StarProgress> {
  const progress = getDb().progress.find((p) => p.starId === starId);
  if (!progress) return fail(`No progress found for ${starId}`);
  return respond(progress);
}

// --- Budget ---

export function getBudget(): Promise<Budget> {
  return respond(getDb().budget);
}

export function getBudgetSummary(): Promise<BudgetSummary> {
  const { maxCents, transactions } = getDb().budget;
  const sum = (status: "paid" | "pending") =>
    transactions
      .filter((t) => t.status === status)
      .reduce((total, t) => total + t.amountCents, 0);
  const spentCents = sum("paid");
  const pendingCents = sum("pending");

  const totals = new Map<BudgetCategory, number>();
  for (const t of transactions) {
    totals.set(t.category, (totals.get(t.category) ?? 0) + t.amountCents);
  }
  const byCategory = [...totals]
    .map(([category, amountCents]) => ({ category, amountCents }))
    .sort((a, b) => b.amountCents - a.amountCents);

  return respond({
    maxCents,
    spentCents,
    pendingCents,
    remainingCents: maxCents - spentCents - pendingCents,
    byCategory,
  });
}

// --- Checklist ---

export function getChecklist(): Promise<ChecklistItem[]> {
  const items = [...getDb().checklist].sort((a, b) =>
    a.dueDate.localeCompare(b.dueDate),
  );
  return respond(items);
}

export function setChecklistItemDone(
  itemId: string,
  isDone: boolean,
): Promise<ChecklistItem> {
  const item = getDb().checklist.find((i) => i.id === itemId);
  if (!item) return fail(`Checklist item ${itemId} not found`);
  item.isDone = isDone;
  item.completedDate = isDone ? todayISO() : undefined;
  persist();
  return respond(item);
}

/** Required, incomplete items past their due date — what we nudge parents about. */
export function getOverdueItems(): Promise<ChecklistItem[]> {
  const today = todayISO();
  const overdue = getDb().checklist.filter(
    (i) => i.required && !i.isDone && i.dueDate < today,
  );
  return respond(overdue);
}

/** Items that need the family's attention (see needsAction). Drives the tab badges. */
export function getActionItems(): Promise<ChecklistItem[]> {
  const items = getDb()
    .checklist.filter(needsAction)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  return respond(items);
}

// --- NMS follow-ups ---

export function getFollowUps(): Promise<StaffFollowUp[]> {
  const items = [...getDb().followUps].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  return respond(items);
}

/** Family asks staff for a status update (would notify the staff member in Zoho). */
export function requestFollowUpUpdate(followUpId: string): Promise<StaffFollowUp> {
  const item = getDb().followUps.find((f) => f.id === followUpId);
  if (!item) return fail(`Follow-up ${followUpId} not found`);
  item.updateRequestedAt = new Date().toISOString();
  persist();
  return respond(item);
}

// --- Mentors ---

export function getMentors(): Promise<Mentor[]> {
  return respond(getDb().mentors);
}

export function getCurrentMentors(): Promise<Mentor[]> {
  const today = todayISO();
  return respond(getDb().mentors.filter((m) => !m.endDate || m.endDate >= today));
}

/** The current mentor assigned to a Star, if any. */
export function getStarMentor(starId: string): Promise<Mentor | null> {
  const today = todayISO();
  const mentor = getDb().mentors.find(
    (m) => m.starId === starId && (!m.endDate || m.endDate >= today),
  );
  return respond(mentor ?? null);
}

const SLOT_TIMES = [
  [15, 30],
  [16, 30],
  [18, 0],
  [19, 0],
] as const;
const SLOT_MINUTES = 30;

/**
 * Open 30-minute slots over the next two weeks (weekdays, after school).
 * Generated from today's date so the demo always has availability; some slots are
 * deterministically "taken" so the calendar looks lived-in.
 */
export function getMentorAvailability(mentorId: string): Promise<MentorSlot[]> {
  const booked = new Set(
    getDb()
      .meetings.filter((m) => m.mentorId === mentorId)
      .map((m) => new Date(m.start).getTime()),
  );
  const slots: MentorSlot[] = [];
  const now = new Date();
  for (let day = 1; day <= 14; day++) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + day);
    if (date.getDay() === 0 || date.getDay() === 6) continue;
    SLOT_TIMES.forEach(([h, min], i) => {
      if ((day * 3 + i) % 4 === 0) return; // already taken
      const start = new Date(date);
      start.setHours(h, min, 0, 0);
      if (booked.has(start.getTime())) return;
      const end = new Date(start.getTime() + SLOT_MINUTES * 60_000);
      slots.push({ start: start.toISOString(), end: end.toISOString() });
    });
  }
  return respond(slots);
}

export function getMeetings(mentorId: string): Promise<MentorMeeting[]> {
  const now = new Date().toISOString();
  const upcoming = getDb()
    .meetings.filter((m) => m.mentorId === mentorId && m.end >= now)
    .sort((a, b) => a.start.localeCompare(b.start));
  return respond(upcoming);
}

export function scheduleMeeting(
  mentorId: string,
  slot: MentorSlot,
  topic: string,
): Promise<MentorMeeting> {
  const data = getDb();
  if (!data.mentors.some((m) => m.id === mentorId)) {
    return fail(`Mentor ${mentorId} not found`);
  }
  const startMs = new Date(slot.start).getTime();
  if (data.meetings.some((m) => m.mentorId === mentorId && new Date(m.start).getTime() === startMs)) {
    return fail("That time was just booked — please pick another slot");
  }

  const meeting: MentorMeeting = {
    id: `mtg_${Date.now()}`,
    mentorId,
    start: slot.start,
    end: slot.end,
    topic: topic.trim() || "Check-in",
    joinUrl: "https://example.org/meet/" + mentorId,
  };
  data.meetings.push(meeting);

  // Booking satisfies any "schedule a check-in" to-do tied to this mentor.
  for (const item of data.checklist) {
    if (
      !item.isDone &&
      item.mentorId === mentorId &&
      item.completesWhen === "mentor-meeting-scheduled"
    ) {
      item.isDone = true;
      item.completedDate = todayISO();
    }
  }

  persist();
  return respond(meeting);
}

export function getMessages(mentorId: string): Promise<MentorMessage[]> {
  const thread = getDb()
    .messages.filter((m) => m.mentorId === mentorId)
    .sort((a, b) => a.sentAt.localeCompare(b.sentAt));
  return respond(thread);
}

export function sendMessage(mentorId: string, body: string): Promise<MentorMessage> {
  const text = body.trim();
  if (!text) return fail("Message can't be empty");
  const message: MentorMessage = {
    id: `msg_${Date.now()}`,
    mentorId,
    from: "family",
    sentAt: new Date().toISOString(),
    body: text,
  };
  getDb().messages.push(message);
  persist();
  return respond(message);
}

// --- Events ---

export function getEvents(): Promise<PortalEvent[]> {
  const now = new Date().toISOString();
  const upcoming = getDb()
    .events.filter((e) => new Date(e.end).toISOString() >= now)
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  return respond(upcoming);
}

export function setRsvp(eventId: string, isRsvped: boolean): Promise<PortalEvent> {
  const event = getDb().events.find((e) => e.id === eventId);
  if (!event) return fail(`Event ${eventId} not found`);
  if (event.isRsvped === isRsvped) return respond(event);
  if (isRsvped && event.spotsLeft === 0) return fail("This event is full");
  event.isRsvped = isRsvped;
  if (event.spotsLeft !== undefined) event.spotsLeft += isRsvped ? -1 : 1;
  persist();
  return respond(event);
}

// --- Pinbook ---

export function getPins(starId: string): Promise<Pin[]> {
  return respond(getDb().pins.filter((p) => p.starId === starId));
}

// --- Visits ---

const NEW_VISIT_AFTER_MS = 6 * 60 * 60 * 1000; // a gap this long counts as a new visit

/**
 * Records this visit and returns when the family was last here. Reloads within a few
 * hours count as the same visit, so the "since your last visit" summary sticks around.
 */
export function recordVisit(): Promise<VisitInfo> {
  const data = getDb();
  const now = new Date();
  if (now.getTime() - new Date(data.visit.current).getTime() > NEW_VISIT_AFTER_MS) {
    data.visit = { previous: data.visit.current, current: now.toISOString() };
    persist();
  }
  return respond(data.visit);
}

// --- Help & feedback ---

/** The family's Family Advisor — their first stop for help. */
export function getFamilyAdvisor(): Promise<Mentor | null> {
  const today = todayISO();
  const advisor = getDb().mentors.find(
    (m) => !m.starId && m.title.startsWith("Family Advisor") && (!m.endDate || m.endDate >= today),
  );
  return respond(advisor ?? null);
}

/** Feedback about the portal itself. In production this lands in Zoho / a feedback inbox. */
export function submitFeedback(
  input: Omit<PortalFeedback, "id" | "submittedAt">,
): Promise<PortalFeedback> {
  const feedback: PortalFeedback = {
    ...input,
    comment: input.comment.trim(),
    id: `fb_${Date.now()}`,
    submittedAt: new Date().toISOString(),
  };
  getDb().feedback.push(feedback);
  persist();
  return respond(feedback);
}

// --- Demo helpers ---

export function resetDemoData(): Promise<void> {
  db = seedDb();
  persist();
  return respond(undefined, 0);
}
