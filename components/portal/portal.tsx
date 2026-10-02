"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Award,
  GraduationCap,
  House,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { needsAction } from "@/lib/checklist";
import { getChecklist, getFamily, getPins, recordVisit } from "@/lib/data";
import { formatGrade, initials } from "@/lib/format";
import { TAB_PATHS, tabFromPath, type TabKey } from "@/lib/routes";
import type { ChecklistItem, Family } from "@/lib/types";

import { FamilyInfo } from "./family-info";
import { HomeTab } from "./home-tab";
import { MentorTab } from "./mentor-tab";
import { isNewPin, Pinbook } from "./pinbook";
import { SiteHeader } from "./site-header";
import { StarProgress } from "./star-progress";

const TABS: { key: TabKey; label: string; short: string; icon: LucideIcon }[] = [
  { key: "home", label: "Home", short: "Home", icon: House },
  { key: "pins", label: "Pinbook", short: "Pins", icon: Award },
  { key: "progress", label: "Progress", short: "Progress", icon: TrendingUp },
  { key: "mentor", label: "Mentor", short: "Mentor", icon: GraduationCap },
  { key: "family", label: "Family info", short: "Family", icon: Users },
];

export function Portal() {
  const [family, setFamily] = useState<Family | null>(null);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  // Each tab has its own path (/mentor, /pinbook, …) so reminder emails can deep-link.
  const tab = tabFromPath(usePathname());
  const [previousVisit, setPreviousVisit] = useState<string | null>(null);
  const [newPinCount, setNewPinCount] = useState(0);

  // pushState swaps the path without a reload (data stays loaded) and syncs with
  // usePathname, so the browser back button moves between tabs.
  const setTab = useCallback((next: TabKey) => {
    const path = TAB_PATHS[next];
    if (path !== window.location.pathname) window.history.pushState(null, "", path);
  }, []);
  const [scheduleOpen, setScheduleOpen] = useState(false);

  const refreshChecklist = useCallback(() => {
    getChecklist().then(setChecklist);
  }, []);

  const openScheduler = () => {
    setTab("mentor");
    setScheduleOpen(true);
  };

  useEffect(() => {
    let active = true;
    Promise.all([getFamily(), getChecklist(), recordVisit()])
      .then(async ([f, items, visit]) => {
        const pins = f.stars[0] ? await getPins(f.stars[0].id) : [];
        if (!active) return;
        setFamily(f);
        setChecklist(items);
        setPreviousVisit(visit.previous);
        setNewPinCount(pins.filter((p) => isNewPin(p, visit.previous)).length);
      })
      .catch((e: Error) => active && setError(e.message));
    return () => {
      active = false;
    };
  }, []);

  const parent = family?.parents.find((p) => p.isPrimary);
  const star = family?.stars[0];
  // One calm count, in one place: Home. Other tabs stay quiet.
  const actionCount = checklist.filter(needsAction).length;

  return (
    <>
      <SiteHeader parent={parent} />

      <section className="bg-brand-slate-light text-white">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:py-5">
          {star ? (
            <div className="flex items-center gap-3 sm:gap-4">
              <Avatar className="size-11 sm:size-12">
                <AvatarFallback className="bg-brand-gold font-heading text-lg font-semibold text-brand-slate">
                  {initials(star.firstName, star.lastName)}
                </AvatarFallback>
              </Avatar>
              <div className="grid gap-1">
                <p className="text-sm text-white/60">
                  Welcome back{parent ? `, ${parent.firstName}` : ""}
                </p>
                <h1 className="text-xl font-semibold">
                  {star.firstName} {star.lastName}
                </h1>
                <div className="flex flex-wrap gap-2">
                  <Badge>{star.program}</Badge>
                  <Badge variant="outline" className="border-white/20 text-white">
                    {star.cohort}
                  </Badge>
                  <Badge variant="outline" className="border-white/20 text-white">
                    {formatGrade(star.grade)}
                    <span className="hidden sm:inline"> · {star.school}</span>
                  </Badge>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Skeleton className="size-12 rounded-full bg-white/10" />
              <div className="grid gap-2">
                <Skeleton className="h-4 w-32 bg-white/10" />
                <Skeleton className="h-7 w-48 bg-white/10" />
              </div>
            </div>
          )}
        </div>
      </section>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        {error && <p className="text-destructive">Couldn&apos;t load your family: {error}</p>}

        {family && star && (
          <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)} className="gap-5">
            <TabsList className="grid h-auto w-full grid-cols-5 gap-1 rounded-2xl bg-card p-1.5 shadow-sm ring-1 ring-foreground/10 group-data-horizontal/tabs:h-auto sm:gap-2 sm:p-2">
              {TABS.map(({ key, label, short, icon: Icon }) => (
                <TabsTrigger
                  key={key}
                  value={key}
                  className="h-auto min-w-0 flex-col gap-1 rounded-xl px-1 py-2.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground data-active:bg-brand-slate data-active:text-white data-active:shadow-md data-active:hover:bg-brand-slate data-active:hover:text-white md:py-3 md:text-sm lg:flex-row lg:gap-2.5 lg:px-4 lg:py-4 lg:text-base [&_svg:not([class*='size-'])]:size-5"
                >
                  <Icon />
                  <span className="lg:hidden">{short}</span>
                  <span className="hidden lg:inline">{label}</span>
                  {key === "pins" && <CountBadge count={newPinCount} label="new" />}
                  {key === "home" && <CountBadge count={actionCount} label="to do" />}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="home">
              <HomeTab
                star={star}
                checklist={checklist}
                previousVisit={previousVisit}
                onChecklistChange={refreshChecklist}
                onSchedule={openScheduler}
                onNavigate={setTab}
              />
            </TabsContent>

            <TabsContent value="pins">
              <Pinbook star={star} previousVisit={previousVisit} />
            </TabsContent>

            <TabsContent value="progress">
              <StarProgress star={star} />
            </TabsContent>

            <TabsContent value="mentor">
              <MentorTab
                star={star}
                onActionChange={refreshChecklist}
                scheduleOpen={scheduleOpen}
                onScheduleOpenChange={setScheduleOpen}
              />
            </TabsContent>

            <TabsContent value="family">
              <FamilyInfo family={family} onChange={setFamily} />
            </TabsContent>
          </Tabs>
        )}

        {!family && !error && <Skeleton className="h-96 rounded-xl" />}
      </main>
    </>
  );
}

/** Small gold count on a tab. Never red: the portal informs, it doesn't alarm. */
function CountBadge({ count, label }: { count: number; label: string }) {
  if (count === 0) return null;
  return (
    <span
      aria-label={`${count} ${label}`}
      className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-gold px-1.5 text-[11px] font-bold text-brand-slate ring-2 ring-card lg:static lg:h-6 lg:ring-0"
    >
      <span className="lg:hidden">{count}</span>
      <span className="hidden lg:inline">
        {count} {label}
      </span>
    </span>
  );
}
