"use client";

import { useState } from "react";
import {
  Award,
  CalendarHeart,
  Check,
  Clock,
  ExternalLink,
  GraduationCap,
  Laptop,
  Mail,
  PartyPopper,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { percentOf } from "@/lib/money";
import type { Parent } from "@/lib/types";
import { cn } from "@/lib/utils";

import { SiteHeader } from "./site-header";

// A brand-new Voyager family on their first login. Static demo data — in production this is
// the same portal, just with an onboarding checklist and empty history.
const parent: Parent = {
  id: "par_new",
  firstName: "Maria",
  lastName: "Hernández",
  relationship: "Mother",
  email: "maria.hernandez@example.com",
  phone: "(915) 555-0117",
  isPrimary: true,
};
const STAR = { firstName: "Mateo", grade: "3rd grade", cohort: "2026 Cohort" };

const FIRST_STEPS = [
  {
    id: "confirm",
    title: "Confirm your family's details",
    desc: "Check Mateo's school and your contact info so we can reach you.",
    minutes: 3,
    action: "Review details",
  },
  {
    id: "agreement",
    title: "Sign the Voyager participation agreement",
    desc: "What NMS commits to, and what we ask of families.",
    minutes: 5,
    action: "Read & sign",
  },
  {
    id: "advisor",
    title: "Book your welcome call with your Family Advisor",
    desc: "A 30-minute video call to get to know Mateo and answer your questions.",
    minutes: 2,
    action: "Pick a time",
  },
  {
    id: "weekend",
    title: "RSVP for Welcome Weekend in October",
    desc: "Meet other new Voyager families in person. Travel is covered.",
    minutes: 1,
    action: "RSVP",
  },
];

const TIMELINE: { when: string; title: string; desc: string; icon: LucideIcon }[] = [
  {
    when: "This week",
    title: "Your Technology Welcome Pack ships",
    desc: "A laptop, books, and math games, sent to your home.",
    icon: Laptop,
  },
  {
    when: "Within 2 weeks",
    title: "Mateo is matched with a math mentor",
    desc: "Weekly 30–60 minute sessions, scheduled around school.",
    icon: GraduationCap,
  },
  {
    when: "First month",
    title: "Mateo's first advanced math course",
    desc: "Your mentor recommends a course at the right level. NMS pays tuition.",
    icon: TrendingUp,
  },
  {
    when: "October",
    title: "Welcome Weekend",
    desc: "Our in-person gathering for new Voyager families.",
    icon: CalendarHeart,
  },
];

export function WelcomeView() {
  const [done, setDone] = useState<Set<string>>(new Set());
  const next = FIRST_STEPS.find((s) => !done.has(s.id));

  return (
    <>
      <SiteHeader parent={parent} view="new" />

      <section className="relative overflow-hidden bg-brand-slate-light text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-16 size-80 rounded-full bg-brand-gold/15 blur-3xl"
        />
        <div className="relative mx-auto grid max-w-6xl gap-3 px-4 py-8 sm:py-10">
          <p className="flex items-center gap-2 text-sm font-medium text-brand-gold">
            <Sparkles className="size-4" />
            {STAR.cohort} · Voyager Stars
          </p>
          <h1 className="text-2xl font-semibold sm:text-3xl">
            Welcome to National Math Stars, {parent.firstName}!
          </h1>
          <p className="max-w-2xl text-white/80 sm:text-lg">
            {STAR.firstName} is one of our newest Stars. This portal is your home base for the next
            ten years. For now, there are just a few things to do, and we&apos;ll handle the rest.
          </p>
          <p className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
            <a
              href="https://nationalmathstars.org/voyager-program/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 font-medium text-brand-gold underline-offset-4 hover:underline"
            >
              How Voyager Stars works
              <ExternalLink className="size-3.5" />
            </a>
            <a
              href="https://nationalmathstars.org/star-stories/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 font-medium text-brand-gold underline-offset-4 hover:underline"
            >
              Read stories from other Star families
              <ExternalLink className="size-3.5" />
            </a>
          </p>
        </div>
      </section>

      <main className="mx-auto grid w-full max-w-6xl flex-1 gap-4 px-4 py-6 lg:grid-cols-3">
        <div className="grid content-start gap-4 lg:col-span-2">
          <FirstSteps done={done} next={next?.id} onDone={(id) => setDone((d) => new Set(d).add(id))} />
          <WhatHappensNext />
        </div>

        <div className="grid content-start gap-4">
          <YourTeam />
          <ComingSoon
            icon={Award}
            title="Mateo's Pinbook"
            body="Pins are earned by finishing STEM challenges with a mentor. The first one usually comes within a couple of months."
          />
          <ComingSoon
            icon={Wallet}
            title="Family budget"
            body="Your annual STEM enrichment budget (robotics, chess, museum memberships, and more) opens after your welcome call."
          />
          <ComingSoon
            icon={TrendingUp}
            title="Progress"
            body="Courses, competitions, and camps will show up here as Mateo's journey begins."
          />
        </div>
      </main>
    </>
  );
}

function FirstSteps({
  done,
  next,
  onDone,
}: {
  done: Set<string>;
  next?: string;
  onDone: (id: string) => void;
}) {
  return (
    <Card className="[--card-spacing:--spacing(5)]">
      <CardHeader>
        <CardTitle className="text-lg">Your first steps</CardTitle>
        <CardDescription>About 10 minutes in total. You can do them in any order.</CardDescription>
        <div className="mt-2 grid gap-1.5">
          <Progress
            value={percentOf(done.size, FIRST_STEPS.length)}
            aria-label="First steps progress"
            className="[&_[data-slot=progress-track]]:h-2"
          />
          <p className="text-xs text-muted-foreground">
            {done.size} of {FIRST_STEPS.length} done
          </p>
        </div>
      </CardHeader>
      <CardContent>
        {!next && (
          <div className="mb-3 flex items-center gap-3 rounded-lg bg-accent p-4">
            <PartyPopper className="size-6 text-brand-gold" />
            <p className="font-medium">
              You&apos;re all set! Your Family Advisor will take it from here.
            </p>
          </div>
        )}
        <ol className="grid gap-2">
          {FIRST_STEPS.map((step, i) => {
            const isDone = done.has(step.id);
            const isNext = step.id === next;
            return (
              <li
                key={step.id}
                className={cn(
                  "flex flex-col gap-3 rounded-xl p-4 ring-1 ring-foreground/10 sm:flex-row sm:items-center",
                  isNext && "bg-accent ring-2 ring-brand-gold",
                  isDone && "opacity-60",
                )}
              >
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full font-heading font-semibold",
                    isDone ? "bg-brand-gold text-brand-slate" : "bg-brand-slate text-white",
                  )}
                >
                  {isDone ? <Check className="size-4" /> : i + 1}
                </span>
                <div className="flex-1">
                  <p className={cn("font-medium", isDone && "line-through")}>
                    {step.title}
                    {isNext && <Badge className="ml-2 align-middle">Start here</Badge>}
                  </p>
                  <p className="text-muted-foreground">{step.desc}</p>
                  <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="size-3.5" />
                    About {step.minutes} min
                  </p>
                </div>
                {!isDone && (
                  <Button
                    variant={isNext ? "default" : "outline"}
                    onClick={() => onDone(step.id)}
                  >
                    {step.action}
                  </Button>
                )}
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}

function WhatHappensNext() {
  return (
    <Card className="[--card-spacing:--spacing(5)]">
      <CardHeader>
        <CardTitle className="text-lg">What happens next</CardTitle>
        <CardDescription>You don&apos;t need to do anything for these. We&apos;ll keep you posted.</CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="relative ml-4 grid gap-6 border-l border-border pl-8">
          {TIMELINE.map(({ when, title, desc, icon: Icon }) => (
            <li key={title} className="relative">
              <span className="absolute top-0 -left-[47px] flex size-7 items-center justify-center rounded-full bg-brand-slate text-brand-gold ring-4 ring-card">
                <Icon className="size-3.5" />
              </span>
              <p className="text-xs font-semibold tracking-wide text-brand-gold uppercase">{when}</p>
              <p className="font-medium">{title}</p>
              <p className="text-muted-foreground">{desc}</p>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}

function YourTeam() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="size-4 text-brand-gold" />
          Your NMS team
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex items-start gap-3">
          <Avatar className="size-10">
            <AvatarFallback className="bg-brand-slate text-brand-gold">DR</AvatarFallback>
          </Avatar>
          <div className="grid gap-0.5">
            <p className="font-medium">Daniela Reyes</p>
            <p className="text-sm text-muted-foreground">Your Family Advisor (Texas)</p>
            <a
              href="mailto:daniela.reyes@example.org"
              className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
            >
              <Mail className="size-3.5" />
              Say hello
            </a>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Avatar className="size-10">
            <AvatarFallback className="bg-muted text-muted-foreground">?</AvatarFallback>
          </Avatar>
          <div className="grid gap-0.5">
            <p className="font-medium">Math mentor</p>
            <p className="text-sm text-muted-foreground">
              We&apos;re finding the right match for {STAR.firstName}. Expect an intro within 2
              weeks.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ComingSoon({ icon: Icon, title, body }: { icon: LucideIcon; title: string; body: string }) {
  return (
    <Card size="sm" className="border border-dashed border-foreground/15 bg-transparent ring-0">
      <CardContent className="flex gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
          <Icon className="size-4.5 text-muted-foreground" />
        </span>
        <div>
          <p className="font-medium">{title}</p>
          <p className="text-sm text-muted-foreground">{body}</p>
        </div>
      </CardContent>
    </Card>
  );
}
