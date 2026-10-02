"use client";

import { useEffect, useState } from "react";
import { BookOpen, ChevronDown, History, Tent, Trophy, type LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getStarProgress } from "@/lib/data";
import { formatDate, formatDateRange } from "@/lib/format";
import type { ISODate, Star, StarProgress as Progress } from "@/lib/types";
import { cn } from "@/lib/utils";

type Kind = "course" | "competition" | "camp";
type Filter = "all" | Kind;

const HISTORY_PREVIEW = 5;

interface HistoryItem {
  id: string;
  kind: Kind;
  sortDate: ISODate;
  dateLabel: string;
  title: string;
  subtitle: string;
  status?: { label: string; variant: "default" | "secondary" | "outline" };
  highlight?: string;
}

const KIND_META: Record<Kind, { icon: LucideIcon; label: string }> = {
  course: { icon: BookOpen, label: "Course" },
  competition: { icon: Trophy, label: "Competition" },
  camp: { icon: Tent, label: "Summer camp" },
};

function toHistory(progress: Progress): HistoryItem[] {
  const courses: HistoryItem[] = progress.courses.map((c) => ({
    id: c.id,
    kind: "course",
    sortDate: c.startDate,
    dateLabel: `${c.term} · ${formatDateRange(c.startDate, c.endDate)}`,
    title: c.title,
    subtitle: c.provider,
    status:
      c.status === "completed"
        ? { label: "Completed", variant: "secondary" }
        : c.status === "in-progress"
          ? { label: "In progress", variant: "default" }
          : { label: "Enrolled", variant: "outline" },
    highlight: c.grade ? `Grade: ${c.grade}` : undefined,
  }));

  const competitions: HistoryItem[] = progress.competitions.map((c) => ({
    id: c.id,
    kind: "competition",
    sortDate: c.date,
    dateLabel: formatDate(c.date),
    title: c.name,
    subtitle: `${c.level} level`,
    highlight: c.score ? `${c.result} · ${c.score}` : c.result,
  }));

  const camps: HistoryItem[] = progress.camps.map((c) => ({
    id: c.id,
    kind: "camp",
    sortDate: c.startDate,
    dateLabel: formatDateRange(c.startDate, c.endDate),
    title: c.name,
    subtitle: c.notes ? `${c.location} · ${c.notes}` : c.location,
    status:
      c.status === "completed"
        ? { label: "Attended", variant: "secondary" }
        : c.status === "upcoming"
          ? { label: "Upcoming", variant: "default" }
          : { label: "Applied", variant: "outline" },
  }));

  return [...courses, ...competitions, ...camps].sort((a, b) =>
    b.sortDate.localeCompare(a.sortDate),
  );
}

export function StarProgress({ star }: { star: Star }) {
  const [progress, setProgress] = useState<Progress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    let active = true;
    getStarProgress(star.id)
      .then((p) => active && setProgress(p))
      .catch((e: Error) => active && setError(e.message));
    return () => {
      active = false;
    };
  }, [star.id]);

  if (error) return <p className="text-destructive">Couldn&apos;t load progress: {error}</p>;
  if (!progress) return <ProgressSkeleton />;

  const history = toHistory(progress);
  const filtered = filter === "all" ? history : history.filter((h) => h.kind === filter);
  const visible = showAll ? filtered : filtered.slice(0, HISTORY_PREVIEW);

  const coursesDone = progress.courses.filter((c) => c.status === "completed").length;
  const results = progress.competitions.length;
  const campsAttended = progress.camps.filter((c) => c.status === "completed").length;

  // The stats double as the history filter.
  const filters: { key: Filter; icon: LucideIcon; value: number; label: string }[] = [
    { key: "all", icon: History, value: history.length, label: "All activity" },
    { key: "course", icon: BookOpen, value: coursesDone, label: "Courses completed" },
    { key: "competition", icon: Trophy, value: results, label: "Competition results" },
    { key: "camp", icon: Tent, value: campsAttended, label: "Camps attended" },
  ];

  return (
    <Card className="sm:[--card-spacing:--spacing(6)]">
      <CardHeader>
        <CardTitle className="text-lg">{star.firstName}&apos;s journey</CardTitle>
        <CardDescription>
          Courses, competitions, and camps since joining NMS — most recent first.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        <div
          role="group"
          aria-label="Filter history"
          className="grid grid-cols-2 gap-3 lg:grid-cols-4"
        >
          {filters.map(({ key, icon: Icon, value, label }) => {
            const active = filter === key;
            return (
              <button
                key={key}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  setFilter(key);
                  setShowAll(false);
                }}
                className={cn(
                  "flex items-center gap-3 rounded-xl p-3 text-left ring-1 transition",
                  "focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                  active
                    ? "bg-brand-slate text-white ring-brand-slate"
                    : "bg-card ring-foreground/10 hover:bg-muted",
                )}
              >
                <span
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-lg",
                    active ? "bg-white/10" : "bg-accent",
                  )}
                >
                  <Icon className="size-5 text-brand-gold" />
                </span>
                <span>
                  <span className="block font-heading text-2xl leading-none font-semibold">
                    {value}
                  </span>
                  <span className={cn("text-sm", active ? "text-white/70" : "text-muted-foreground")}>
                    {label}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <ol className="relative ml-4 grid gap-6 border-l border-border pl-8">
          {visible.map((item) => {
            const { icon: Icon, label } = KIND_META[item.kind];
            return (
              <li key={item.id} className="relative">
                <span className="absolute top-0 -left-[47px] flex size-7 items-center justify-center rounded-full bg-brand-slate text-brand-gold ring-4 ring-card">
                  <Icon className="size-3.5" />
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{item.title}</p>
                  {item.status && (
                    <Badge variant={item.status.variant}>{item.status.label}</Badge>
                  )}
                </div>
                <p className="text-muted-foreground">{item.subtitle}</p>
                <p className="text-xs text-muted-foreground">
                  {label} · {item.dateLabel}
                </p>
                {item.highlight && (
                  <p className="mt-1 font-medium text-brand-ink">
                    {item.kind === "competition" && (
                      <Trophy className="mr-1 inline size-3.5 text-brand-gold" />
                    )}
                    {item.highlight}
                  </p>
                )}
              </li>
            );
          })}
        </ol>

        {filtered.length > HISTORY_PREVIEW && (
          <Button
            variant="ghost"
            className="justify-self-start"
            onClick={() => setShowAll((v) => !v)}
          >
            <ChevronDown
              data-icon="inline-start"
              className={cn("transition-transform", showAll && "rotate-180")}
            />
            {showAll ? "Show less" : `Show all ${filtered.length}`}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function ProgressSkeleton() {
  return <Skeleton className="h-[32rem] rounded-xl" />;
}
