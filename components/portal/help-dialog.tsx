"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Frown, LifeBuoy, Mail, Meh, Send, Smile, type LucideIcon } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { getFamilyAdvisor, getMessages, sendMessage, submitFeedback } from "@/lib/data";
import { formatDateTime, initials } from "@/lib/format";
import type { FeedbackRating, Mentor, MentorMessage } from "@/lib/types";
import { cn } from "@/lib/utils";

// The new-family demo has its own (static) advisor.
const NEW_FAMILY_ADVISOR: Mentor = {
  id: "men_new_advisor",
  name: "Daniela Reyes",
  title: "Family Advisor (Texas)",
  state: "TX",
  specialty: "Onboarding new Voyager families",
  email: "daniela.reyes@example.org",
  startDate: "2026-06-01",
};

const RATINGS: { value: FeedbackRating; label: string; icon: LucideIcon }[] = [
  { value: "great", label: "Working great", icon: Smile },
  { value: "okay", label: "It's okay", icon: Meh },
  { value: "frustrating", label: "Frustrating", icon: Frown },
];

/** Header button that opens "Get help" + "Share feedback" — reachable from every page. */
export function HelpButton({ view }: { view: "returning" | "new" }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"help" | "feedback">("help");

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="text-white/80 hover:bg-white/10 hover:text-white"
        aria-label="Help & feedback"
      >
        <LifeBuoy data-icon="inline-start" />
        <span className="hidden md:inline">Help &amp; feedback</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg">How can we help?</DialogTitle>
            <DialogDescription>
              Ask your Family Advisor anything, or tell us how the portal is working for you.
            </DialogDescription>
          </DialogHeader>

          <Tabs value={tab} onValueChange={(v) => setTab(v as "help" | "feedback")}>
            <TabsList className="w-full">
              <TabsTrigger value="help">Get help</TabsTrigger>
              <TabsTrigger value="feedback">Share feedback</TabsTrigger>
            </TabsList>
            <TabsContent value="help" className="pt-3">
              <GetHelp view={view} />
            </TabsContent>
            <TabsContent value="feedback" className="pt-3">
              <ShareFeedback onSent={() => setOpen(false)} />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}

function GetHelp({ view }: { view: "returning" | "new" }) {
  const [advisor, setAdvisor] = useState<Mentor | null | undefined>(
    view === "new" ? NEW_FAMILY_ADVISOR : undefined,
  );
  const [thread, setThread] = useState<MentorMessage[]>([]);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (view === "new") return;
    let active = true;
    getFamilyAdvisor().then(async (a) => {
      const messages = a ? await getMessages(a.id) : [];
      if (!active) return;
      setAdvisor(a);
      setThread(messages);
    });
    return () => {
      active = false;
    };
  }, [view]);

  async function send(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!advisor) return;
    setSending(true);
    try {
      const msg = await sendMessage(advisor.id, body);
      setThread((t) => [...t, msg]);
      setBody("");
      toast.success(`Sent to ${advisor.name}`, {
        description: "Family Advisors usually reply within one business day.",
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSending(false);
    }
  }

  if (advisor === undefined) return <Skeleton className="h-48" />;

  return (
    <div className="grid gap-4">
      {advisor && (
        <form onSubmit={send} className="grid gap-3">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback className="bg-brand-slate text-brand-gold">
                {initials(...advisor.name.split(" "))}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{advisor.name}</p>
              <p className="text-sm text-muted-foreground">
                Your {advisor.title} · replies within one business day
              </p>
            </div>
          </div>

          {thread.length > 0 && (
            <ul className="grid max-h-40 gap-2 overflow-y-auto">
              {thread.map((m) => (
                <li
                  key={m.id}
                  className={cn(
                    "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                    m.from === "family"
                      ? "justify-self-end bg-brand-slate text-white"
                      : "justify-self-start bg-muted",
                  )}
                >
                  {m.body}
                  <span
                    className={cn(
                      "mt-0.5 block text-xs",
                      m.from === "family" ? "text-white/60" : "text-muted-foreground",
                    )}
                  >
                    {formatDateTime(m.sentAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <Label htmlFor="help-message" className="sr-only">
            Message to {advisor.name}
          </Label>
          <Textarea
            id="help-message"
            rows={4}
            placeholder="Hi! I have a question about…"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
          />
          <Button type="submit" disabled={sending || !body.trim()} className="justify-self-start">
            <Send data-icon="inline-start" />
            {sending ? "Sending…" : `Message ${advisor.name.split(" ")[0]}`}
          </Button>
        </form>
      )}

      <div className="grid gap-2 rounded-lg bg-muted/60 p-3 text-sm">
        <p className="font-medium">Other ways to reach us</p>
        <a
          href="mailto:info@nationalmathstars.org"
          className="inline-flex items-center gap-2 hover:underline underline-offset-4"
        >
          <Mail className="size-4 text-brand-gold" />
          info@nationalmathstars.org
        </a>
        <a
          href="https://nationalmathstars.org/contact/"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 hover:underline underline-offset-4"
        >
          <ExternalLink className="size-4 text-brand-gold" />
          NMS contact page
        </a>
      </div>
    </div>
  );
}

function ShareFeedback({ onSent }: { onSent: () => void }) {
  const [rating, setRating] = useState<FeedbackRating | null>(null);
  const [comment, setComment] = useState("");
  const [canContact, setCanContact] = useState(true);
  const [sending, setSending] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!rating) return;
    setSending(true);
    try {
      await submitFeedback({ rating, comment, canContact, page: window.location.pathname });
      toast.success("Thank you! Your feedback goes straight to the NMS team.");
      setRating(null);
      setComment("");
      onSent();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <fieldset className="grid gap-2">
        <legend className="mb-2 font-medium">How is the portal working for you?</legend>
        <div className="grid grid-cols-3 gap-2">
          {RATINGS.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              aria-pressed={rating === value}
              onClick={() => setRating(value)}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-xl p-3 text-sm ring-1 transition",
                "focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                rating === value
                  ? "bg-accent font-medium ring-2 ring-brand-gold"
                  : "ring-foreground/10 hover:bg-muted",
              )}
            >
              <Icon className={cn("size-7", rating === value ? "text-brand-gold" : "text-muted-foreground")} />
              {label}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-1.5">
        <Label htmlFor="feedback-comment">
          What would make it better? <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Textarea
          id="feedback-comment"
          rows={4}
          placeholder="Something confusing, missing, or that you'd love to see…"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="feedback-contact"
          checked={canContact}
          onCheckedChange={(checked) => setCanContact(checked === true)}
        />
        <Label htmlFor="feedback-contact" className="font-normal">
          It&apos;s okay to contact me about this
        </Label>
      </div>

      <Button type="submit" disabled={!rating || sending} className="justify-self-start">
        {sending ? "Sending…" : "Send feedback"}
      </Button>
    </form>
  );
}
