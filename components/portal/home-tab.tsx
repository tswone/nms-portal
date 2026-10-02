"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowRight,
  Award,
  BellRing,
  CalendarDays,
  CalendarPlus,
  Check,
  ChevronDown,
  CircleCheck,
  Clock,
  ExternalLink,
  Handshake,
  MapPin,
  MessageSquare,
  PartyPopper,
  Video,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { isOverdue } from "@/lib/checklist";
import {
  getBudgetSummary,
  getEvents,
  getFollowUps,
  getMeetings,
  getMentors,
  getMessages,
  getPins,
  getStarMentor,
  requestFollowUpUpdate,
  setChecklistItemDone,
} from "@/lib/data";
import { daysUntil, formatDate, formatDay, formatTime } from "@/lib/format";
import { formatCents, percentOf } from "@/lib/money";
import type {
  BudgetSummary,
  ChecklistItem,
  Mentor,
  MentorMeeting,
  PortalEvent,
  StaffFollowUp,
  Star,
} from "@/lib/types";
import { cn } from "@/lib/utils";

import { EventsDialog } from "./events-dialog";
import { isNewPin } from "./pinbook";
import { SpendingDialog } from "./spending-dialog";

const LIST_PREVIEW = 3;

interface HomeTabProps {
  star: Star;
  checklist: ChecklistItem[];
  previousVisit: string | null;
  onChecklistChange: () => void;
  onSchedule: () => void;
  onNavigate: (tab: "pins" | "mentor" | "progress") => void;
}

/** Past-due required items first, then required by due date, then optional. */
function byPriority(a: ChecklistItem, b: ChecklistItem) {
  return (
    Number(isOverdue(b) && b.required) - Number(isOverdue(a) && a.required) ||
    Number(b.required) - Number(a.required) ||
    a.dueDate.localeCompare(b.dueDate)
  );
}

export function HomeTab({
  star,
  checklist,
  previousVisit,
  onChecklistChange,
  onSchedule,
  onNavigate,
}: HomeTabProps) {
  const open = checklist.filter((i) => !i.isDone).sort(byPriority);
  const [next, ...rest] = open;

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {previousVisit && (
        <SinceLastVisit star={star} previousVisit={previousVisit} onNavigate={onNavigate} />
      )}
      <div className="grid content-start gap-4 lg:col-span-2">
        <NextStep
          item={next}
          star={star}
          openCount={open.length}
          onChange={onChecklistChange}
          onSchedule={onSchedule}
        />
        <TodoList
          rest={rest}
          checklist={checklist}
          onChange={onChecklistChange}
          onSchedule={onSchedule}
        />
        <NmsCommitments checklist={checklist} />
      </div>
      <div className="grid content-start gap-4">
        <ComingUp star={star} onSchedule={onSchedule} />
        <BudgetGlance />
      </div>
    </div>
  );
}

// --- What changed since the family last checked in (compact: good news, not homework) ---

interface NewsItem {
  id: string;
  icon: LucideIcon;
  text: string;
  tab?: "pins" | "mentor" | "progress";
}

function SinceLastVisit({
  star,
  previousVisit,
  onNavigate,
}: {
  star: Star;
  previousVisit: string;
  onNavigate: HomeTabProps["onNavigate"];
}) {
  const [news, setNews] = useState<NewsItem[] | null>(null);

  useEffect(() => {
    let active = true;
    const since = new Date(previousVisit).getTime();
    const sinceDate = previousVisit.slice(0, 10);

    Promise.all([getPins(star.id), getStarMentor(star.id), getFollowUps()]).then(
      async ([pins, mentor, followUps]) => {
        const messages = mentor ? await getMessages(mentor.id) : [];
        const items: NewsItem[] = [];

        const newPins = pins.filter((p) => isNewPin(p, previousVisit));
        if (newPins.length > 0) {
          items.push({
            id: "pins",
            icon: Award,
            text: `${star.firstName} earned ${newPins.length === 1 ? "a new pin" : `${newPins.length} new pins`}`,
            tab: "pins",
          });
        }

        const newMessages = messages.filter(
          (m) => m.from === "mentor" && new Date(m.sentAt).getTime() > since,
        );
        if (mentor && newMessages.length > 0) {
          items.push({
            id: "messages",
            icon: MessageSquare,
            text: `${newMessages.length === 1 ? "A message" : `${newMessages.length} messages`} from ${mentor.name}`,
            tab: "mentor",
          });
        }

        for (const f of followUps.filter((f) => f.completedDate && f.completedDate > sinceDate)) {
          items.push({ id: f.id, icon: CircleCheck, text: `NMS finished: ${f.title}` });
        }

        if (active) setNews(items);
      },
    );
    return () => {
      active = false;
    };
  }, [star, previousVisit]);

  if (!news || news.length === 0) return null;

  return (
    <section
      aria-label="Since your last visit"
      className="flex flex-wrap items-center gap-2 lg:col-span-3"
    >
      <span className="mr-1 text-sm text-muted-foreground">
        New since {formatDay(previousVisit)}:
      </span>
      {news.map(({ id, icon: Icon, text, tab }) => {
        const content = (
          <>
            <Icon className="size-4 text-brand-gold" />
            {text}
            {tab && <ArrowRight className="size-3.5 text-muted-foreground" />}
          </>
        );
        const className =
          "inline-flex items-center gap-2 rounded-full bg-card px-3.5 py-1.5 text-sm font-medium ring-1 ring-foreground/10";
        return tab ? (
          <button
            key={id}
            type="button"
            onClick={() => onNavigate(tab)}
            className={cn(className, "transition hover:bg-muted")}
          >
            {content}
          </button>
        ) : (
          <span key={id} className={className}>
            {content}
          </span>
        );
      })}
    </section>
  );
}

// --- "What do I do?" — one clear next step ---

function useToggleDone(item: ChecklistItem | undefined, onChange: () => void) {
  const [saving, setSaving] = useState(false);
  const toggle = useCallback(
    async (isDone: boolean) => {
      if (!item) return;
      setSaving(true);
      try {
        await setChecklistItemDone(item.id, isDone);
        onChange();
        if (isDone) {
          toast.success(`Nice! "${item.title}" is done.`, {
            action: {
              label: "Undo",
              onClick: () => setChecklistItemDone(item.id, false).then(onChange),
            },
          });
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setSaving(false);
      }
    },
    [item, onChange],
  );
  return { saving, toggle };
}

/** Friendly due text: past due is amber and factual, never alarming. */
function dueText(item: ChecklistItem) {
  const days = daysUntil(item.dueDate);
  if (days < 0) return `Past due · was due ${formatDate(item.dueDate)}`;
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  if (days <= 14) return `Due in ${days} days`;
  return `Due ${formatDate(item.dueDate)}`;
}

function NextStep({
  item,
  star,
  openCount,
  onChange,
  onSchedule,
}: {
  item: ChecklistItem | undefined;
  star: Star;
  openCount: number;
  onChange: () => void;
  onSchedule: () => void;
}) {
  const { saving, toggle } = useToggleDone(item, onChange);

  if (!item) {
    return (
      <Card className="border-l-4 border-brand-gold">
        <CardContent className="flex items-center gap-4">
          <PartyPopper className="size-8 text-brand-gold" />
          <div>
            <p className="font-heading text-lg font-semibold">You&apos;re all caught up!</p>
            <p className="text-muted-foreground">
              Nothing needs you right now for {star.firstName}. We&apos;ll email you when something
              new comes up.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const overdue = isOverdue(item);
  const isScheduling = item.completesWhen === "mentor-meeting-scheduled";

  return (
    <Card className="border-l-4 border-brand-gold [--card-spacing:--spacing(5)]">
      <CardHeader>
        <p className="text-xs font-semibold tracking-wide text-brand-gold uppercase">
          Start here{openCount > 1 && ` · 1 of ${openCount}`}
        </p>
        <CardTitle className="text-xl font-semibold">{item.title}</CardTitle>
        <CardDescription className="text-base">{item.shortDesc}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {item.estMinutes && (
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <Clock className="size-4" />
              About {item.estMinutes} min
            </span>
          )}
          <span
            className={cn(
              "inline-flex items-center gap-1.5",
              overdue ? "font-medium text-amber-700" : "text-muted-foreground",
            )}
          >
            <CalendarDays className="size-4" />
            {dueText(item)}
          </span>
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {isScheduling ? (
            <Button size="lg" onClick={onSchedule}>
              <CalendarPlus data-icon="inline-start" />
              Pick a time
            </Button>
          ) : item.url ? (
            <Button
              size="lg"
              render={<a href={item.url} target="_blank" rel="noreferrer" />}
              nativeButton={false}
            >
              Open the form
              <ExternalLink data-icon="inline-end" />
            </Button>
          ) : null}
          {!isScheduling && (
            <Button
              size="lg"
              variant={item.url ? "outline" : "default"}
              onClick={() => toggle(true)}
              disabled={saving}
            >
              <Check data-icon="inline-start" />
              I&apos;ve done this
            </Button>
          )}
        </div>
        {item.url && !isScheduling && (
          <p className="text-xs text-muted-foreground">
            The form opens in a new tab. Come back and tap &ldquo;I&apos;ve done this&rdquo; once
            it&apos;s submitted.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// --- The rest of the family's list ---

function TodoList({
  rest,
  checklist,
  onChange,
  onSchedule,
}: {
  rest: ChecklistItem[];
  checklist: ChecklistItem[];
  onChange: () => void;
  onSchedule: () => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const [showDone, setShowDone] = useState(false);

  const done = checklist
    .filter((i) => i.isDone)
    .sort((a, b) => (b.completedDate ?? "").localeCompare(a.completedDate ?? ""));
  const visible = showAll ? rest : rest.slice(0, LIST_PREVIEW);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Then, when you have a minute</CardTitle>
        <div className="mt-1 grid gap-1.5">
          <Progress
            value={percentOf(done.length, checklist.length)}
            aria-label="Checklist progress"
            className="[&_[data-slot=progress-track]]:h-2"
          />
          <p className="text-xs text-muted-foreground">
            {done.length} of {checklist.length} done this year
          </p>
        </div>
      </CardHeader>
      <CardContent className="grid gap-2">
        {rest.length === 0 && (
          <p className="text-muted-foreground">Nothing else on your list right now.</p>
        )}
        <ul className="grid gap-2">
          {visible.map((item) => (
            <StepRow key={item.id} item={item} onChange={onChange} onSchedule={onSchedule} />
          ))}
        </ul>

        <div className="flex flex-wrap gap-1">
          {rest.length > LIST_PREVIEW && (
            <Button variant="ghost" onClick={() => setShowAll((v) => !v)}>
              <ChevronDown
                data-icon="inline-start"
                className={cn("transition-transform", showAll && "rotate-180")}
              />
              {showAll ? "Show fewer" : `Show ${rest.length - LIST_PREVIEW} more`}
            </Button>
          )}
          {done.length > 0 && (
            <Button
              variant="ghost"
              className="text-muted-foreground"
              onClick={() => setShowDone((v) => !v)}
            >
              <ChevronDown
                data-icon="inline-start"
                className={cn("transition-transform", showDone && "rotate-180")}
              />
              {showDone ? "Hide completed" : `Completed (${done.length})`}
            </Button>
          )}
        </div>
        {showDone && (
          <ul className="grid gap-2">
            {done.map((item) => (
              <StepRow key={item.id} item={item} onChange={onChange} onSchedule={onSchedule} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function StepRow({
  item,
  onChange,
  onSchedule,
}: {
  item: ChecklistItem;
  onChange: () => void;
  onSchedule: () => void;
}) {
  const { saving, toggle } = useToggleDone(item, onChange);
  const overdue = isOverdue(item);
  const id = `step-${item.id}`;

  return (
    <li
      className={cn(
        "flex items-start gap-3 rounded-lg p-3 ring-1 ring-foreground/10",
        item.isDone && "opacity-70",
      )}
    >
      <Checkbox
        id={id}
        checked={item.isDone}
        disabled={saving}
        onCheckedChange={(checked) => toggle(checked === true)}
        aria-label={`Mark "${item.title}" as done`}
        className="mt-0.5 size-5"
      />
      <div className="grid flex-1 gap-0.5">
        <label
          htmlFor={id}
          className={cn("cursor-pointer font-medium", item.isDone && "line-through")}
        >
          {item.title}
          {!item.required && (
            <span className="ml-2 text-xs font-normal text-muted-foreground">Optional</span>
          )}
        </label>
        <p className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {item.isDone ? (
            <span>Done</span>
          ) : (
            <span className={cn(overdue && "font-medium text-amber-700")}>{dueText(item)}</span>
          )}
          {!item.isDone && item.estMinutes && <span>About {item.estMinutes} min</span>}
          <span>For {item.ownerName}</span>
        </p>
      </div>
      {!item.isDone && (
        <div className="shrink-0">
          {item.completesWhen === "mentor-meeting-scheduled" ? (
            <Button size="sm" variant="outline" onClick={onSchedule}>
              <CalendarPlus data-icon="inline-start" />
              Schedule
            </Button>
          ) : item.url ? (
            <Button
              size="sm"
              variant="outline"
              render={<a href={item.url} target="_blank" rel="noreferrer" />}
              nativeButton={false}
            >
              Open
              <ExternalLink data-icon="inline-end" />
            </Button>
          ) : null}
        </div>
      )}
    </li>
  );
}

// --- NMS side of the relationship (summary first, details on demand) ---

function NmsCommitments({ checklist }: { checklist: ChecklistItem[] }) {
  const [data, setData] = useState<{ items: StaffFollowUp[]; staff: Mentor[] } | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([getFollowUps(), getMentors()]).then(([items, staff]) => {
      if (active) setData({ items, staff });
    });
    return () => {
      active = false;
    };
  }, []);

  if (!data) return <Skeleton className="h-28 rounded-xl" />;

  const open = data.items.filter((f) => !f.isDone);
  const done = data.items.filter((f) => f.isDone);
  const staffName = (id: string) => data.staff.find((s) => s.id === id)?.name ?? "NMS staff";
  const blocker = (f: StaffFollowUp) =>
    f.blockedBy ? checklist.find((c) => c.id === f.blockedBy && !c.isDone) : undefined;
  const waiting = open.filter((f) => blocker(f)).length;
  const behind = open.filter((f) => !blocker(f) && daysUntil(f.dueDate) < 0).length;

  const summary = [
    `${open.length} in progress`,
    waiting > 0 && `${waiting} waiting on one of your to-dos`,
    behind > 0 && `${behind} behind schedule`,
  ]
    .filter(Boolean)
    .join(" · ");

  function onUpdated(updated: StaffFollowUp) {
    setData((d) => d && { ...d, items: d.items.map((f) => (f.id === updated.id ? updated : f)) });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Handshake className="size-5 text-brand-gold" />
          What NMS is doing for you
        </CardTitle>
        <CardDescription>{summary}</CardDescription>
      </CardHeader>
      {expanded && (
        <CardContent className="grid gap-2">
          <ul className="grid gap-2">
            {open.map((f) => (
              <CommitmentRow
                key={f.id}
                item={f}
                staffName={staffName(f.staffId)}
                waitingOn={blocker(f)}
                onUpdated={onUpdated}
              />
            ))}
            {done.map((f) => (
              <li
                key={f.id}
                className="flex items-center gap-3 rounded-lg p-3 opacity-70 ring-1 ring-foreground/10"
              >
                <CircleCheck className="size-5 text-brand-gold" />
                <div className="flex-1">
                  <p className="font-medium">{f.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {staffName(f.staffId)}
                    {f.completedDate && ` · done ${formatDate(f.completedDate)}`}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      )}
      <CardFooter className="border-t bg-muted/40 py-2">
        <Button variant="ghost" onClick={() => setExpanded((v) => !v)}>
          <ChevronDown
            data-icon="inline-start"
            className={cn("transition-transform", expanded && "rotate-180")}
          />
          {expanded ? "Hide details" : "See details"}
        </Button>
      </CardFooter>
    </Card>
  );
}

function CommitmentRow({
  item,
  staffName,
  waitingOn,
  onUpdated,
}: {
  item: StaffFollowUp;
  staffName: string;
  waitingOn?: ChecklistItem;
  onUpdated: (item: StaffFollowUp) => void;
}) {
  const [saving, setSaving] = useState(false);
  const behind = !waitingOn && daysUntil(item.dueDate) < 0;

  async function askForUpdate() {
    setSaving(true);
    try {
      const updated = await requestFollowUpUpdate(item.id);
      onUpdated(updated);
      toast.success(`We let ${staffName} know you're waiting`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  const status = waitingOn
    ? { label: "Waiting on you", className: "bg-accent text-brand-ink" }
    : behind
      ? { label: "Behind schedule", className: "bg-amber-100 text-amber-800" }
      : { label: "On track", className: "bg-muted text-muted-foreground" };

  return (
    <li className="flex flex-col gap-3 rounded-lg p-3 ring-1 ring-foreground/10 sm:flex-row sm:items-start">
      <div className="grid flex-1 gap-0.5">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium">{item.title}</p>
          <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", status.className)}>
            {status.label}
          </span>
        </div>
        <p className="text-muted-foreground">{item.shortDesc}</p>
        <p className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="font-medium text-brand-ink">{staffName}</span>
          {waitingOn ? (
            <span>Starts once you finish &ldquo;{waitingOn.title}&rdquo;</span>
          ) : (
            <span>
              {behind ? `Was due ${formatDate(item.dueDate)}` : `Expected by ${formatDate(item.dueDate)}`}
            </span>
          )}
        </p>
      </div>
      {behind && (
        <div className="shrink-0">
          {item.updateRequestedAt ? (
            <span className="text-xs text-muted-foreground">
              Update requested {formatDay(item.updateRequestedAt)}
            </span>
          ) : (
            <Button size="sm" variant="outline" onClick={askForUpdate} disabled={saving}>
              <BellRing data-icon="inline-start" />
              Ask for an update
            </Button>
          )}
        </div>
      )}
    </li>
  );
}

// --- Sidebar ---

function ComingUp({ star, onSchedule }: { star: Star; onSchedule: () => void }) {
  const [data, setData] = useState<{
    mentor: Mentor | null;
    meetings: MentorMeeting[];
    events: PortalEvent[];
  } | null>(null);
  const [browseOpen, setBrowseOpen] = useState(false);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let active = true;
    Promise.all([getStarMentor(star.id), getEvents()]).then(async ([mentor, events]) => {
      const meetings = mentor ? await getMeetings(mentor.id) : [];
      if (active) setData({ mentor, meetings, events: events.filter((e) => e.isRsvped) });
    });
    return () => {
      active = false;
    };
  }, [star.id, version]);

  if (!data) return <Skeleton className="h-56 rounded-xl" />;

  const items = [
    ...data.meetings.map((m) => ({
      id: m.id,
      start: m.start,
      title: `${m.topic} with ${data.mentor?.name ?? "mentor"}`,
      where: "Video call",
      icon: Video,
    })),
    ...data.events.map((e) => ({
      id: e.id,
      start: e.start,
      title: e.title,
      where: e.format === "virtual" ? "Virtual" : e.location,
      icon: e.format === "virtual" ? Video : MapPin,
    })),
  ]
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
    .slice(0, 3);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="size-4 text-brand-gold" />
          You&apos;re signed up for
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        {items.length === 0 && <p className="text-muted-foreground">Nothing on the calendar yet.</p>}
        {items.map(({ id, start, title, where, icon: Icon }) => {
          const d = new Date(start);
          return (
            <div key={id} className="flex gap-3">
              <div className="flex w-11 shrink-0 flex-col items-center self-start rounded-lg bg-brand-slate py-1 text-white">
                <span className="text-[10px] font-semibold uppercase text-brand-gold">
                  {d.toLocaleDateString("en-US", { month: "short" })}
                </span>
                <span className="font-heading text-lg leading-none font-semibold">
                  {d.getDate()}
                </span>
              </div>
              <div className="grid gap-0.5">
                <p className="leading-snug font-medium">{title}</p>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Icon className="size-3.5 shrink-0" />
                  {formatDay(start)}, {formatTime(start)} · {where}
                </p>
              </div>
            </div>
          );
        })}
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2 border-t bg-muted/40 py-3">
        <Button variant="secondary" onClick={() => setBrowseOpen(true)}>
          Browse events &amp; RSVP
        </Button>
        {data.mentor && data.meetings.length === 0 && (
          <Button variant="ghost" onClick={onSchedule}>
            Book mentor call
          </Button>
        )}
      </CardFooter>
      <EventsDialog
        open={browseOpen}
        onOpenChange={setBrowseOpen}
        onChange={() => setVersion((v) => v + 1)}
      />
    </Card>
  );
}

function BudgetGlance() {
  const [summary, setSummary] = useState<BudgetSummary | null>(null);
  const [spendingOpen, setSpendingOpen] = useState(false);

  useEffect(() => {
    let active = true;
    getBudgetSummary().then((s) => active && setSummary(s));
    return () => {
      active = false;
    };
  }, []);

  if (!summary) return <Skeleton className="h-36 rounded-xl" />;

  const used = summary.spentCents + summary.pendingCents;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="size-4 text-brand-gold" />
          Family budget
        </CardTitle>
        <CardDescription>
          <span className="font-heading text-2xl font-semibold text-foreground">
            {formatCents(summary.remainingCents)}
          </span>{" "}
          left of {formatCents(summary.maxCents)}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-1.5">
        <Progress
          value={percentOf(used, summary.maxCents)}
          aria-label="Budget used"
          className="[&_[data-slot=progress-track]]:h-2"
        />
        <p className="text-xs text-muted-foreground">
          {formatCents(summary.spentCents)} spent · {formatCents(summary.pendingCents)} pending
        </p>
      </CardContent>
      <CardFooter className="border-t bg-muted/40 py-3">
        <Button variant="secondary" onClick={() => setSpendingOpen(true)}>
          See what it&apos;s been spent on
        </Button>
      </CardFooter>
      <SpendingDialog open={spendingOpen} onOpenChange={setSpendingOpen} />
    </Card>
  );
}
