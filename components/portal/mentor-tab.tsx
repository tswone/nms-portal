"use client";

import { useEffect, useState } from "react";
import {
  CalendarCheck,
  CalendarPlus,
  Mail,
  MapPin,
  MessageSquare,
  Send,
  Sparkles,
  Video,
} from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  getMeetings,
  getMentorAvailability,
  getMentors,
  getMessages,
  scheduleMeeting,
  sendMessage,
} from "@/lib/data";
import { formatDate, formatDateTime, formatDay, formatTime, initials } from "@/lib/format";
import type { Mentor, MentorMeeting, MentorMessage, MentorSlot, Star } from "@/lib/types";
import { cn } from "@/lib/utils";

interface MentorTabProps {
  star: Star;
  /** Called after anything that may change the family's action items. */
  onActionChange: () => void;
  scheduleOpen: boolean;
  onScheduleOpenChange: (open: boolean) => void;
}

const mentorInitials = (name: string) =>
  initials(...name.replace(/^Dr\.\s+/, "").split(" "));

export function MentorTab({
  star,
  onActionChange,
  scheduleOpen,
  onScheduleOpenChange,
}: MentorTabProps) {
  const [mentors, setMentors] = useState<Mentor[] | null>(null);
  const [meetings, setMeetings] = useState<MentorMeeting[]>([]);
  const [messages, setMessages] = useState<MentorMessage[]>([]);
  const [messageOpen, setMessageOpen] = useState(false);

  const today = new Date().toLocaleDateString("en-CA");
  const isCurrent = (m: Mentor) => !m.endDate || m.endDate >= today;
  const mentor = mentors?.find((m) => m.starId === star.id && isCurrent(m));
  const team = mentors?.filter((m) => !m.starId && isCurrent(m)) ?? [];
  const previous = mentors?.filter((m) => m.starId === star.id && !isCurrent(m)) ?? [];

  useEffect(() => {
    let active = true;
    getMentors().then((all) => active && setMentors(all));
    return () => {
      active = false;
    };
  }, []);

  const mentorId = mentor?.id;
  useEffect(() => {
    if (!mentorId) return;
    let active = true;
    Promise.all([getMeetings(mentorId), getMessages(mentorId)]).then(([mtgs, msgs]) => {
      if (!active) return;
      setMeetings(mtgs);
      setMessages(msgs);
    });
    return () => {
      active = false;
    };
  }, [mentorId]);

  if (!mentors) return <Skeleton className="h-80 rounded-xl" />;

  if (!mentor) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No mentor assigned yet</CardTitle>
          <CardDescription>
            We&apos;re matching {star.firstName} with a mentor. We&apos;ll email you as soon as
            they&apos;re assigned.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const firstName = mentor.name.replace(/^Dr\.\s+/, "").split(" ")[0];
  const nextMeeting = meetings[0];

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="grid content-start gap-4 lg:col-span-2">
        {/* Mentor profile + primary actions */}
        <Card>
          <CardContent className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <Avatar className="size-20">
              <AvatarFallback className="bg-brand-slate font-heading text-2xl font-semibold text-brand-gold">
                {mentorInitials(mentor.name)}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 gap-3">
              <div>
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  {star.firstName}&apos;s mentor
                </p>
                <h2 className="text-xl font-semibold">{mentor.name}</h2>
                <p className="text-muted-foreground">{mentor.title}</p>
              </div>
              <div className="flex flex-wrap gap-x-5 gap-y-2 text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Sparkles className="size-4 text-brand-gold" />
                  {mentor.specialty}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="size-4 text-brand-gold" />
                  Based in {mentor.state}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CalendarCheck className="size-4 text-brand-gold" />
                  Mentoring since {formatDate(mentor.startDate)}
                </span>
              </div>
              {mentor.sessionSchedule && (
                <p className="inline-flex items-center gap-2 justify-self-start rounded-lg bg-accent px-3 py-1.5 font-medium text-brand-ink">
                  <Video className="size-4 text-brand-gold" />
                  {mentor.sessionSchedule}
                </p>
              )}
              <div className="flex flex-wrap gap-2 pt-1">
                <Button size="lg" onClick={() => onScheduleOpenChange(true)}>
                  <CalendarPlus data-icon="inline-start" />
                  Schedule a meeting
                </Button>
                <Button size="lg" variant="secondary" onClick={() => setMessageOpen(true)}>
                  <MessageSquare data-icon="inline-start" />
                  Send a message
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  render={<a href={`mailto:${mentor.email}`} />}
                  nativeButton={false}
                >
                  <Mail data-icon="inline-start" />
                  Email
                </Button>
              </div>
            </div>
          </CardContent>
          {nextMeeting && (
            <CardFooter className="flex flex-wrap items-center gap-3 border-t bg-muted/50 py-3">
              <Video className="size-4 text-brand-gold" />
              <p className="flex-1">
                <span className="font-medium">Next meeting:</span>{" "}
                {formatDay(nextMeeting.start)} at {formatTime(nextMeeting.start)} ·{" "}
                {nextMeeting.topic}
              </p>
              <Button
                size="sm"
                variant="outline"
                render={<a href={nextMeeting.joinUrl} target="_blank" rel="noreferrer" />}
                nativeButton={false}
              >
                Join link
              </Button>
            </CardFooter>
          )}
        </Card>

        {/* Message thread */}
        <Card>
          <CardHeader>
            <CardTitle>Messages with {firstName}</CardTitle>
            <CardDescription>Mentors usually reply within one school day.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {messages.length === 0 && (
              <p className="text-muted-foreground">No messages yet — say hello!</p>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "max-w-[85%] rounded-xl px-3.5 py-2.5",
                  msg.from === "family"
                    ? "justify-self-end bg-brand-slate text-white"
                    : "justify-self-start bg-muted",
                )}
              >
                <p>{msg.body}</p>
                <p
                  className={cn(
                    "mt-1 text-xs",
                    msg.from === "family" ? "text-white/60" : "text-muted-foreground",
                  )}
                >
                  {msg.from === "family" ? "You" : firstName} · {formatDateTime(msg.sentAt)}
                </p>
              </div>
            ))}
          </CardContent>
          <CardFooter className="border-t bg-muted/50 py-3">
            <Button variant="outline" onClick={() => setMessageOpen(true)}>
              <Send data-icon="inline-start" />
              Write a message
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Supporting team */}
      <div className="grid content-start gap-4">
        {team.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Your NMS team</CardTitle>
              <CardDescription>For questions beyond math — school, logistics, budget.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              {team.map((person, i) => (
                <div key={person.id} className="grid gap-3">
                  {i > 0 && <Separator />}
                  <div className="flex items-start gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-accent text-brand-ink">
                        {mentorInitials(person.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 gap-0.5">
                      <p className="font-medium">{person.name}</p>
                      <p className="text-muted-foreground">{person.title}</p>
                      <p className="text-xs text-muted-foreground">{person.specialty}</p>
                      <a
                        href={`mailto:${person.email}`}
                        className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
                      >
                        <Mail className="size-3.5" />
                        {person.email}
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {previous.length > 0 && (
          <Card size="sm">
            <CardHeader>
              <CardTitle>Previous mentors</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              {previous.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-2">
                  <span>{p.name}</span>
                  <Badge variant="outline">
                    {formatDate(p.startDate)} – {p.endDate && formatDate(p.endDate)}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      <ScheduleDialog
        mentor={mentor}
        open={scheduleOpen}
        onOpenChange={onScheduleOpenChange}
        onScheduled={(meeting) => {
          setMeetings((m) => [...m, meeting].sort((a, b) => a.start.localeCompare(b.start)));
          onActionChange();
        }}
      />
      <MessageDialog
        mentor={mentor}
        open={messageOpen}
        onOpenChange={setMessageOpen}
        onSent={(msg) => setMessages((m) => [...m, msg])}
      />
    </div>
  );
}

function ScheduleDialog({
  mentor,
  open,
  onOpenChange,
  onScheduled,
}: {
  mentor: Mentor;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScheduled: (meeting: MentorMeeting) => void;
}) {
  const [slots, setSlots] = useState<MentorSlot[] | null>(null);
  const [day, setDay] = useState<string | null>(null);
  const [slot, setSlot] = useState<MentorSlot | null>(null);
  const [topic, setTopic] = useState("Fall check-in");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    let active = true;
    getMentorAvailability(mentor.id).then((s) => {
      if (!active) return;
      setSlots(s);
      setDay(s[0] ? formatDay(s[0].start) : null);
      setSlot(null);
    });
    return () => {
      active = false;
    };
  }, [open, mentor.id]);

  const days = [...new Set(slots?.map((s) => formatDay(s.start)))];
  const daySlots = slots?.filter((s) => formatDay(s.start) === day) ?? [];

  async function confirm() {
    if (!slot) return;
    setSaving(true);
    try {
      const meeting = await scheduleMeeting(mentor.id, slot, topic);
      toast.success(`Booked with ${mentor.name}`, {
        description: `${formatDay(meeting.start)} at ${formatTime(meeting.start)}`,
      });
      onScheduled(meeting);
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Schedule time with {mentor.name}</DialogTitle>
          <DialogDescription>
            30-minute video call. Times are shown in your time zone.
          </DialogDescription>
        </DialogHeader>

        {!slots ? (
          <Skeleton className="h-40" />
        ) : slots.length === 0 ? (
          <p className="text-muted-foreground">
            No open times in the next two weeks — send a message and we&apos;ll find a time.
          </p>
        ) : (
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Day</Label>
              <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                {days.map((d) => (
                  <Button
                    key={d}
                    type="button"
                    size="sm"
                    variant={d === day ? "secondary" : "outline"}
                    onClick={() => {
                      setDay(d);
                      setSlot(null);
                    }}
                  >
                    {d}
                  </Button>
                ))}
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Time</Label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {daySlots.map((s) => (
                  <Button
                    key={s.start}
                    type="button"
                    variant={slot?.start === s.start ? "default" : "outline"}
                    onClick={() => setSlot(s)}
                  >
                    {formatTime(s.start)}
                  </Button>
                ))}
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="meeting-topic">What would you like to talk about?</Label>
              <Input
                id="meeting-topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button onClick={confirm} disabled={!slot || saving}>
            {saving
              ? "Booking…"
              : slot
                ? `Book ${formatDay(slot.start)}, ${formatTime(slot.start)}`
                : "Pick a time"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MessageDialog({
  mentor,
  open,
  onOpenChange,
  onSent,
}: {
  mentor: Mentor;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSent: (message: MentorMessage) => void;
}) {
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSending(true);
    try {
      const msg = await sendMessage(mentor.id, body);
      toast.success(`Message sent to ${mentor.name}`);
      onSent(msg);
      setBody("");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>Message {mentor.name}</DialogTitle>
            <DialogDescription>
              Questions about coursework, competitions, or how things are going.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            aria-label="Message"
            rows={5}
            placeholder="Hi! I had a question about…"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
          />
          <DialogFooter>
            <DialogClose render={<Button variant="outline" type="button" />}>
              Cancel
            </DialogClose>
            <Button type="submit" disabled={sending || !body.trim()}>
              <Send data-icon="inline-start" />
              {sending ? "Sending…" : "Send"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
