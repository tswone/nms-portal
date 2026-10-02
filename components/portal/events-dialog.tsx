"use client";

import { useEffect, useState } from "react";
import { Check, ExternalLink, MapPin, Users, Video } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { getEvents, setRsvp } from "@/lib/data";
import { formatDay, formatTime } from "@/lib/format";
import type { PortalEvent } from "@/lib/types";
import { cn } from "@/lib/utils";

const AUDIENCE_LABEL: Record<PortalEvent["audience"], string> = {
  Stars: "For Stars",
  Parents: "For parents",
  Families: "For the whole family",
};

interface EventsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after an RSVP changes so "Coming up" can refresh. */
  onChange: () => void;
}

/** Browse upcoming virtual + in-person events and RSVP. */
export function EventsDialog({ open, onOpenChange, onChange }: EventsDialogProps) {
  const [events, setEvents] = useState<PortalEvent[] | null>(null);

  useEffect(() => {
    if (!open) return;
    let active = true;
    getEvents().then((e) => active && setEvents(e));
    return () => {
      active = false;
    };
  }, [open]);

  function onUpdated(updated: PortalEvent) {
    setEvents((list) => list?.map((e) => (e.id === updated.id ? updated : e)) ?? null);
    onChange();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-lg">Upcoming events</DialogTitle>
          <DialogDescription>
            RSVP here to save your spot. Some events have extra sign-up details on the event page.
          </DialogDescription>
        </DialogHeader>

        {!events ? (
          <Skeleton className="h-64" />
        ) : (
          <ul className="grid gap-3">
            {events.map((event) => (
              <EventRow key={event.id} event={event} onUpdated={onUpdated} />
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}

function EventRow({
  event,
  onUpdated,
}: {
  event: PortalEvent;
  onUpdated: (event: PortalEvent) => void;
}) {
  const [saving, setSaving] = useState(false);
  const d = new Date(event.start);
  const full = event.spotsLeft === 0 && !event.isRsvped;
  const PlaceIcon = event.format === "virtual" ? Video : MapPin;

  async function toggle() {
    setSaving(true);
    try {
      const updated = await setRsvp(event.id, !event.isRsvped);
      onUpdated(updated);
      toast.success(updated.isRsvped ? `You're going to ${event.title}` : "RSVP canceled");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <li
      className={cn(
        "flex gap-3 rounded-xl p-3 ring-1 ring-foreground/10",
        event.isRsvped && "bg-accent ring-brand-gold/40",
      )}
    >
      <div className="flex w-12 shrink-0 flex-col items-center self-start rounded-lg bg-brand-slate py-1.5 text-white">
        <span className="text-[10px] font-semibold uppercase text-brand-gold">
          {d.toLocaleDateString("en-US", { month: "short" })}
        </span>
        <span className="font-heading text-lg leading-none font-semibold">{d.getDate()}</span>
      </div>
      <div className="grid flex-1 gap-1">
        <p className="font-medium leading-snug">{event.title}</p>
        <p className="text-sm text-muted-foreground">{event.description}</p>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <PlaceIcon className="size-3.5" />
            {formatDay(event.start)}, {formatTime(event.start)} ·{" "}
            {event.format === "virtual" ? "Virtual" : event.location}
          </span>
          <span className="inline-flex items-center gap-1">
            <Users className="size-3.5" />
            {AUDIENCE_LABEL[event.audience]}
            {event.spotsLeft !== undefined && ` · ${event.spotsLeft} spots left`}
          </span>
        </p>
        <div className="mt-1.5 flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={event.isRsvped ? "outline" : "default"}
            onClick={toggle}
            disabled={saving || full}
          >
            {event.isRsvped ? (
              <>
                <Check data-icon="inline-start" />
                Going · Cancel
              </>
            ) : full ? (
              "Full"
            ) : (
              "RSVP"
            )}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            render={<a href={event.signupUrl} target="_blank" rel="noreferrer" />}
            nativeButton={false}
          >
            Event page
            <ExternalLink data-icon="inline-end" />
          </Button>
        </div>
      </div>
    </li>
  );
}
