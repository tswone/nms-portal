"use client";

import { useEffect, useState } from "react";
import {
  Bot,
  ChartColumn,
  CircleCheck,
  Circle,
  Code,
  Construction,
  Dices,
  FlaskConical,
  Lock,
  ScrollText,
  Hash,
  Sigma,
  Sparkles,
  Telescope,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { getMentors, getPins } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { percentOf } from "@/lib/money";
import type { Mentor, Pin, PinArea, Star } from "@/lib/types";
import { cn } from "@/lib/utils";

const PIN_ICONS: Record<string, LucideIcon> = {
  hash: Hash,
  code: Code,
  scroll: ScrollText,
  telescope: Telescope,
  sigma: Sigma,
  construction: Construction,
  dices: Dices,
  flask: FlaskConical,
  chart: ChartColumn,
  bot: Bot,
};

// Each STEM area gets its own enamel color.
const AREA_STYLE: Record<PinArea, { fill: string; ring: string; text: string; chip: string; hex: string }> = {
  Math: {
    fill: "from-amber-300 to-amber-500",
    ring: "ring-amber-200",
    text: "text-amber-600",
    chip: "bg-amber-100 text-amber-800",
    hex: "#f5a800",
  },
  Science: {
    fill: "from-teal-300 to-teal-600",
    ring: "ring-teal-200",
    text: "text-teal-600",
    chip: "bg-teal-100 text-teal-800",
    hex: "#0d9488",
  },
  Technology: {
    fill: "from-violet-400 to-violet-600",
    ring: "ring-violet-200",
    text: "text-violet-600",
    chip: "bg-violet-100 text-violet-800",
    hex: "#7c3aed",
  },
  Engineering: {
    fill: "from-sky-400 to-blue-600",
    ring: "ring-sky-200",
    text: "text-sky-600",
    chip: "bg-sky-100 text-sky-800",
    hex: "#0284c7",
  },
};

const AREAS = Object.keys(AREA_STYLE) as PinArea[];

type PinStatus = "earned" | "in-progress" | "locked";

function statusOf(pin: Pin): PinStatus {
  if (pin.earnedDate) return "earned";
  return pin.requirements.some((r) => r.done) ? "in-progress" : "locked";
}

const stepsDone = (pin: Pin) => pin.requirements.filter((r) => r.done).length;

/** True if the pin was earned after the family's previous visit. */
export function isNewPin(pin: Pin, previousVisit: string | null): boolean {
  if (!pin.earnedDate || !previousVisit) return false;
  return pin.earnedDate > previousVisit.slice(0, 10);
}

interface PinbookProps {
  star: Star;
  previousVisit: string | null;
}

export function Pinbook({ star, previousVisit }: PinbookProps) {
  const [pins, setPins] = useState<Pin[] | null>(null);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [area, setArea] = useState<PinArea | "All">("All");
  const [selected, setSelected] = useState<Pin | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([getPins(star.id), getMentors()]).then(([p, m]) => {
      if (!active) return;
      setPins(p);
      setMentors(m);
    });
    return () => {
      active = false;
    };
  }, [star.id]);

  if (!pins) return <Skeleton className="h-96 rounded-xl" />;

  const earned = pins
    .filter((p) => statusOf(p) === "earned")
    .sort((a, b) => (b.earnedDate ?? "").localeCompare(a.earnedDate ?? ""));
  const inProgress = pins
    .filter((p) => statusOf(p) === "in-progress")
    .sort(
      (a, b) =>
        stepsDone(b) / b.requirements.length - stepsDone(a) / a.requirements.length,
    );
  const locked = pins.filter((p) => statusOf(p) === "locked");
  const closest = inProgress[0];
  const newCount = earned.filter((p) => isNewPin(p, previousVisit)).length;

  const inArea = (list: Pin[]) => (area === "All" ? list : list.filter((p) => p.area === area));

  return (
    <div className="grid gap-5">
      {/* Collection header */}
      <section className="relative overflow-hidden rounded-2xl bg-brand-slate p-5 text-white sm:p-6">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-16 -right-10 size-56 rounded-full bg-brand-gold/15 blur-2xl"
        />
        <div className="relative grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
          <div className="grid gap-3">
            <p className="flex items-center gap-2 text-sm font-medium text-brand-gold">
              <Sparkles className="size-4" />
              {star.firstName}&apos;s Pinbook
            </p>
            <h2 className="text-2xl font-semibold sm:text-3xl">
              {earned.length} pins earned
              {newCount > 0 && (
                <span className="ml-3 inline-flex translate-y-[-3px] items-center rounded-full bg-brand-gold px-2.5 py-0.5 align-middle text-sm font-bold text-brand-slate">
                  {newCount} new!
                </span>
              )}
            </h2>
            <div className="grid max-w-md gap-1.5">
              <Progress
                value={percentOf(earned.length, pins.length)}
                aria-label="Pins collected"
                className="[&_[data-slot=progress-track]]:h-2.5 [&_[data-slot=progress-track]]:bg-white/15"
              />
              <p className="text-sm text-white/70">
                {earned.length} of {pins.length} collected · {inProgress.length} in progress
              </p>
            </div>
          </div>

          {closest && (
            <button
              type="button"
              onClick={() => setSelected(closest)}
              className="flex items-center gap-4 rounded-xl bg-white/10 p-3 pr-5 text-left ring-1 ring-white/15 transition hover:bg-white/15"
            >
              <PinMedallion pin={closest} size="md" />
              <div>
                <p className="text-xs font-medium tracking-wide text-brand-gold uppercase">
                  Almost there
                </p>
                <p className="font-heading font-semibold">{closest.name}</p>
                <p className="text-sm text-white/70">
                  {closest.requirements.length - stepsDone(closest)} more{" "}
                  {closest.requirements.length - stepsDone(closest) === 1 ? "step" : "steps"} to go
                </p>
              </div>
            </button>
          )}
        </div>
      </section>

      {/* Area filter */}
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="group" aria-label="Filter by area">
        {(["All", ...AREAS] as const).map((a) => {
          const count = a === "All" ? earned.length : earned.filter((p) => p.area === a).length;
          const total = a === "All" ? pins.length : pins.filter((p) => p.area === a).length;
          return (
            <Button
              key={a}
              size="lg"
              variant={area === a ? "secondary" : "outline"}
              className="rounded-full"
              aria-pressed={area === a}
              onClick={() => setArea(a)}
            >
              {a !== "All" && (
                <span
                  aria-hidden
                  className="size-2.5 rounded-full"
                  style={{ backgroundColor: AREA_STYLE[a].hex }}
                />
              )}
              {a}
              <span className="text-xs opacity-60">
                {count}/{total}
              </span>
            </Button>
          );
        })}
      </div>

      <PinSection
        title="Earned"
        pins={inArea(earned)}
        empty="No pins here yet — keep going!"
        previousVisit={previousVisit}
        onSelect={setSelected}
      />
      <PinSection
        title="In progress"
        pins={inArea(inProgress)}
        empty="Nothing in progress in this area."
        previousVisit={previousVisit}
        onSelect={setSelected}
      />
      <PinSection
        title="Still to discover"
        pins={inArea(locked)}
        empty="You've started every pin in this area!"
        previousVisit={previousVisit}
        onSelect={setSelected}
      />

      <PinDialog
        pin={selected}
        mentors={mentors}
        onOpenChange={(open) => !open && setSelected(null)}
      />
    </div>
  );
}

function PinSection({
  title,
  pins,
  empty,
  previousVisit,
  onSelect,
}: {
  title: string;
  pins: Pin[];
  empty: string;
  previousVisit: string | null;
  onSelect: (pin: Pin) => void;
}) {
  return (
    <section className="grid gap-3">
      <h3 className="text-lg font-semibold">
        {title} <span className="text-base font-normal text-muted-foreground">({pins.length})</span>
      </h3>
      {pins.length === 0 ? (
        <p className="text-muted-foreground">{empty}</p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {pins.map((pin) => (
            <li key={pin.id}>
              <PinTile pin={pin} isNew={isNewPin(pin, previousVisit)} onSelect={onSelect} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function PinTile({
  pin,
  isNew,
  onSelect,
}: {
  pin: Pin;
  isNew: boolean;
  onSelect: (pin: Pin) => void;
}) {
  const status = statusOf(pin);
  const done = stepsDone(pin);

  return (
    <button
      type="button"
      onClick={() => onSelect(pin)}
      className={cn(
        "group relative flex h-full w-full flex-col items-center gap-2 rounded-2xl bg-card p-4 text-center ring-1 ring-foreground/10 transition",
        "hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
        isNew && "ring-2 ring-brand-gold",
      )}
    >
      {isNew && (
        <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-brand-gold px-2 py-0.5 text-[10px] font-bold tracking-wider text-brand-slate uppercase shadow-sm">
          New
        </span>
      )}
      <PinMedallion pin={pin} size="lg" shine={isNew} />
      <p
        className={cn(
          "font-heading text-sm leading-tight font-semibold",
          status === "locked" && "text-muted-foreground",
        )}
      >
        {pin.name}
      </p>
      <p className="text-xs text-muted-foreground">
        {status === "earned" && pin.earnedDate && formatDate(pin.earnedDate)}
        {status === "in-progress" && `${done} of ${pin.requirements.length} steps`}
        {status === "locked" && `${pin.requirements.length} steps`}
      </p>
    </button>
  );
}

const SIZES = {
  md: { outer: "size-14", icon: "size-6", lock: "size-3.5" },
  lg: { outer: "size-20", icon: "size-8", lock: "size-4" },
  xl: { outer: "size-32", icon: "size-14", lock: "size-6" },
} as const;

/** The pin itself: shiny enamel when earned, a progress ring while in progress, a mystery when locked. */
function PinMedallion({
  pin,
  size,
  shine = false,
}: {
  pin: Pin;
  size: keyof typeof SIZES;
  shine?: boolean;
}) {
  const Icon = PIN_ICONS[pin.icon] ?? Sparkles;
  const style = AREA_STYLE[pin.area];
  const status = statusOf(pin);
  const s = SIZES[size];

  if (status === "earned") {
    return (
      <div
        className={cn(
          "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br shadow-md ring-4 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6",
          style.fill,
          style.ring,
          s.outer,
        )}
      >
        <Icon className={cn("text-white drop-shadow", s.icon)} strokeWidth={2.25} />
        {/* glossy highlight */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-2 top-1 h-1/3 rounded-full bg-white/35 blur-[2px]"
        />
        {shine && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 -left-full w-1/2 -skew-x-12 animate-pin-shine bg-gradient-to-r from-transparent via-white/70 to-transparent"
          />
        )}
      </div>
    );
  }

  if (status === "in-progress") {
    const pct = (stepsDone(pin) / pin.requirements.length) * 100;
    return (
      <div
        className={cn("relative flex shrink-0 items-center justify-center rounded-full p-1", s.outer)}
        style={{ background: `conic-gradient(${style.hex} ${pct}%, var(--muted) ${pct}%)` }}
      >
        <div className="flex size-full items-center justify-center rounded-full bg-card">
          <Icon className={cn(style.text, "opacity-80", s.icon)} />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/30 bg-muted",
        s.outer,
      )}
    >
      <Icon className={cn("text-muted-foreground/30", s.icon)} />
      <span className="absolute -right-0.5 -bottom-0.5 flex items-center justify-center rounded-full bg-card p-1 ring-1 ring-foreground/10">
        <Lock className={cn("text-muted-foreground", s.lock)} />
      </span>
    </div>
  );
}

function PinDialog({
  pin,
  mentors,
  onOpenChange,
}: {
  pin: Pin | null;
  mentors: Mentor[];
  onOpenChange: (open: boolean) => void;
}) {
  // Keep the last pin around while the dialog animates closed.
  const [shown, setShown] = useState<Pin | null>(pin);
  if (pin && pin !== shown) setShown(pin);

  const p = pin ?? shown;
  if (!p) return null;

  const status = statusOf(p);
  const style = AREA_STYLE[p.area];
  const verifier = mentors.find((m) => m.id === p.verifiedBy);
  const left = p.requirements.length - stepsDone(p);

  return (
    <Dialog open={pin !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <div className="flex flex-col items-center gap-3 pt-2 text-center">
          <PinMedallion pin={p} size="xl" shine={status === "earned"} />
          <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", style.chip)}>
            {p.area}
          </span>
        </div>
        <DialogHeader className="items-center text-center">
          <DialogTitle className="text-xl font-semibold">{p.name}</DialogTitle>
          <DialogDescription>{p.description}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-2">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            How to earn it
          </p>
          <ul className="grid gap-2">
            {p.requirements.map((r) => (
              <li key={r.id} className="flex items-start gap-2.5">
                {r.done ? (
                  <CircleCheck className={cn("mt-0.5 size-5 shrink-0", style.text)} />
                ) : (
                  <Circle className="mt-0.5 size-5 shrink-0 text-muted-foreground/40" />
                )}
                <div>
                  <p className={cn(r.done && "text-muted-foreground")}>{r.text}</p>
                  {r.completedDate && (
                    <p className="text-xs text-muted-foreground">Done {formatDate(r.completedDate)}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className={cn("rounded-lg p-3 text-center text-sm", status === "earned" ? "bg-accent" : "bg-muted")}>
          {status === "earned" && p.earnedDate && (
            <>
              <span className="font-semibold">Earned {formatDate(p.earnedDate)}</span>
              {verifier && <> · verified by {verifier.name}</>}
            </>
          )}
          {status === "in-progress" && (
            <>
              <span className="font-semibold">
                {left} {left === 1 ? "step" : "steps"} to go!
              </span>{" "}
              Your mentor checks off steps as you finish them.
            </>
          )}
          {status === "locked" && (
            <>Ready for a new challenge? Ask your mentor about starting this pin.</>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
