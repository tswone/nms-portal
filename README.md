# NMS Parent Portal

A self-service portal prototype for National Math Stars families, built as a two-hour work sample.

**Live:** https://nms-portal.vercel.app

Two edits were made after the recorded session: demo dates now move with the calendar so the demo stays current, and the original brief in `spec.md` was replaced with a paraphrased summary.

You're signed in as the Delgado family. Sofia is a 5th-grade Voyager Star in rural Ohio. All data is dummy data.

To see what a brand-new family sees on day one (first steps, what happens next, empty states), use the **Demo** switch in the header or go to [/welcome](https://nms-portal.vercel.app/welcome).

## What a parent can do

| Spec item | Where |
|---|---|
| See and update basic info (school, address, contacts) | **Family info** tab. Edit dialogs save immediately |
| Interactive checklist of to-dos | **Home**. A "Start here" card shows the most important item, then the rest of the list with a progress bar |
| Nudges for required actions they're behind on | **Home** count badge, past-due items listed first, and the "Start here" card |
| Star's progress and history (courses, competitions, camps) | **Progress** tab. The stat cards also filter the history |
| What the family budget was spent on, and what's left | **Home**, Family budget card, then "See what it's been spent on" |
| Browse events and RSVP, with reminders of what they're signed up for | **Home**, "You're signed up for" card, then "Browse events & RSVP" |
| Merit badge pinbook (optional item) | **Pinbook** tab |

Two more pieces round out the relationship:
- **"What NMS is doing for you"**: the staff side of the relationship. Each commitment has a named owner and a due date, and shows "waiting on you" when it's blocked by a family to-do.
- **Mentor tab**: the Star's mentor, scheduling a call, and messages.

## Design notes

- **Built for weekly or every-other-week visits.** Home leads with what's new since the last visit and a single next step. Each tab has its own path (`/mentor`, `/pinbook`, `/progress`, `/family`), so reminder emails can link straight to it.
- **Calm by default.** There's one count badge, nothing is shown in red, and past-due items are stated plainly rather than as alarms.
- **Aligned with nationalmathstars.org.** Voyager program details, Family Advisor and Math Mentor roles, and Midwest regions all match the site.

## Architecture

- **Stack:** Next.js (App Router) and TypeScript, Tailwind CSS v4, shadcn/ui (Base UI), and lucide icons. Poppins is used for headings and Inter for body text.
- **`lib/data.ts`** is a mock service that mimics the eventual Zoho CRM and Ramp/QuickBooks integrations.
  - Every function is async with simulated latency, so the UI is already built against a real request/response shape.
  - Writes persist to `localStorage`, so each visitor gets their own sandbox.
- **`lib/types.ts`** has the domain types. **`lib/seed.ts`** has the dummy data.
- **Money** is stored as integer cents everywhere (`lib/money.ts`) to avoid floating-point errors.
- **`components/portal/`** holds one component per tab or feature. `components/ui/` holds the generated shadcn primitives.

## Production build-out (proposed)

This prototype uses mock data in the browser. A full build would keep the same UI and replace `lib/data.ts` with real services:

| Layer | Proposal | Why |
|---|---|---|
| Database | **Postgres on Neon** | Serverless Postgres with a first-class Vercel integration. Branching gives every preview deploy its own copy of the data |
| Auth | **Clerk** | Easy sign-in for parents (email magic links, no passwords to forget). Roles for parent, staff and mentor, with MFA for staff |
| ORM | **Prisma** | Typed schema and migrations that mirror `lib/types.ts`. A good fit while this portal is the only app using the database |
| Source of truth | **Zoho CRM** (families, to-dos, staff), **Ramp/QuickBooks** (budget) | The portal's database is a synced cache; portal edits are written back through the Zoho API |
| Sync | **Webhooks + scheduled refresh** (Vercel Cron) | Webhooks for fast-changing data (to-dos, RSVPs, messages) and a periodic full sync as a safety net |

Only parents sign in; Stars, many of them under 13, don't get accounts. See `notes.md` for open questions.

## Run locally

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # production build
npm run lint
```

To reset the demo data, clear the site's local storage in your browser.
