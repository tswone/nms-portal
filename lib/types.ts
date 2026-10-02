// Domain types for the NMS parent portal.
// Shapes loosely mirror what we'd pull from Zoho (CRM) and Ramp/QuickBooks (budget).
// Dates are ISO strings so everything serializes cleanly to/from storage and APIs.

export type ISODate = string; // "2026-10-02"
export type ISODateTime = string; // "2026-10-14T18:00:00-05:00"

export type Program = "Pathfinder" | "Voyager";

export interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
}

export interface Parent {
  id: string;
  firstName: string;
  lastName: string;
  relationship: string; // "Mother", "Father", "Guardian", ...
  email: string;
  phone: string;
  isPrimary: boolean;
}

export interface Star {
  id: string;
  firstName: string;
  lastName: string;
  grade: number;
  school: string;
  schoolDistrict: string;
  program: Program;
  cohort: string; // e.g. "2025 Cohort"
  joinedDate: ISODate;
  avatarUrl?: string;
}

export interface Family {
  id: string;
  familyName: string;
  address: Address;
  parents: Parent[];
  stars: Star[];
}

// --- Progress / history ---

export type CourseStatus = "completed" | "in-progress" | "enrolled";

export interface MathCourse {
  id: string;
  starId: string;
  title: string;
  provider: string;
  term: string; // "Fall 2026"
  status: CourseStatus;
  grade?: string;
  startDate: ISODate;
  endDate: ISODate;
}

export interface CompetitionResult {
  id: string;
  starId: string;
  name: string;
  date: ISODate;
  level: "School" | "Regional" | "State" | "National";
  result: string; // "Gold Award", "3rd Place", ...
  score?: string;
}

export interface SummerCamp {
  id: string;
  starId: string;
  name: string;
  location: string;
  startDate: ISODate;
  endDate: ISODate;
  status: "completed" | "upcoming" | "applied";
  notes?: string;
}

export interface StarProgress {
  starId: string;
  courses: MathCourse[];
  competitions: CompetitionResult[];
  camps: SummerCamp[];
}

// --- Budget ---
// Money is stored as integer cents to avoid floating-point rounding errors.

// Voyager's annual family budget covers STEM enrichment; courses and one summer camp
// a year are funded by NMS separately.
export type BudgetCategory =
  | "Clubs & Lessons"
  | "Memberships"
  | "Equipment"
  | "Books & Games"
  | "Workshops"
  | "Competitions"
  | "Travel";

export interface BudgetTransaction {
  id: string;
  date: ISODate;
  description: string;
  vendor: string;
  category: BudgetCategory;
  amountCents: number; // integer cents, e.g. 49500 = $495.00
  status: "paid" | "pending";
}

export interface Budget {
  familyId: string;
  fiscalYear: string; // "2026–27"
  maxCents: number;
  transactions: BudgetTransaction[];
}

// All money values are integer cents.
export interface BudgetSummary {
  maxCents: number;
  spentCents: number;
  pendingCents: number;
  remainingCents: number;
  byCategory: { category: BudgetCategory; amountCents: number }[];
}

// --- Checklist ---

/** The part of the portal a to-do relates to — drives the tab attention badges. */
export type PortalArea = "progress" | "family" | "mentor" | "budget" | "events";

export interface ChecklistItem {
  id: string;
  title: string;
  shortDesc: string;
  dueDate: ISODate;
  isDone: boolean;
  completedDate?: ISODate;
  url?: string;
  nudgeCount: number; // how many reminders we've sent
  estMinutes?: number; // rough effort, shown so a busy parent can pick it up
  ownerName: string; // who is responsible (parent or Star)
  mentorId?: string;
  required: boolean;
  area: PortalArea;
  /** Completed automatically when this happens elsewhere in the portal. */
  completesWhen?: "mentor-meeting-scheduled";
}

// --- NMS follow-ups ---
// The staff side of the relationship: what NMS has committed to do for the family.

export interface StaffFollowUp {
  id: string;
  title: string;
  shortDesc: string;
  staffId: string; // Mentor/staff id
  dueDate: ISODate;
  isDone: boolean;
  completedDate?: ISODate;
  /** Checklist item the family needs to finish before staff can act. */
  blockedBy?: string;
  updateRequestedAt?: ISODateTime;
}

// --- Mentors ---

export interface Mentor {
  id: string;
  name: string;
  title: string;
  state: string;
  specialty: string;
  email: string;
  startDate: ISODate;
  endDate?: ISODate; // undefined = current mentor
  starId?: string; // the Star they mentor; undefined = family-level staff
  sessionSchedule?: string; // Voyager Stars meet their math mentor weekly
  avatarUrl?: string;
}

export interface MentorSlot {
  start: ISODateTime;
  end: ISODateTime;
}

export interface MentorMeeting {
  id: string;
  mentorId: string;
  start: ISODateTime;
  end: ISODateTime;
  topic: string;
  joinUrl: string;
}

export interface MentorMessage {
  id: string;
  mentorId: string;
  from: "family" | "mentor";
  sentAt: ISODateTime;
  body: string;
}

// --- Events ---

export type EventFormat = "virtual" | "in-person";

export interface PortalEvent {
  id: string;
  title: string;
  description: string;
  format: EventFormat;
  start: ISODateTime;
  end: ISODateTime;
  location: string; // address or "Zoom"
  audience: "Stars" | "Parents" | "Families";
  signupUrl: string; // we link out for full signup
  capacity?: number;
  spotsLeft?: number;
  isRsvped: boolean;
}

// --- Pinbook (merit badges) ---

export type PinArea = "Math" | "Science" | "Technology" | "Engineering";

export interface PinRequirement {
  id: string;
  text: string;
  done: boolean;
  completedDate?: ISODate;
}

export interface Pin {
  id: string;
  starId: string;
  name: string;
  area: PinArea;
  icon: string; // icon key, mapped to an icon in the UI
  description: string;
  requirements: PinRequirement[];
  earnedDate?: ISODate; // set once every requirement is verified
  verifiedBy?: string; // staff/mentor id
}

// --- Visits ---

/** Lets the portal show "since your last visit" to families who check in every week or two. */
export interface VisitInfo {
  previous: ISODateTime | null;
  current: ISODateTime;
}

// --- Portal feedback ---

export type FeedbackRating = "great" | "okay" | "frustrating";

export interface PortalFeedback {
  id: string;
  rating: FeedbackRating;
  comment: string;
  canContact: boolean;
  page: string; // where they were when they sent it
  submittedAt: ISODateTime;
}
