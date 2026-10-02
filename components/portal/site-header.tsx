import Link from "next/link";
import { Star } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { initials } from "@/lib/format";
import type { Parent } from "@/lib/types";
import { cn } from "@/lib/utils";

type DemoView = "returning" | "new";

export function SiteHeader({ parent, view }: { parent?: Parent; view: DemoView }) {
  return (
    <header className="bg-brand-slate text-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-brand-gold">
            <Star className="size-5 fill-brand-slate text-brand-slate" />
          </div>
          <div className="leading-tight">
            <p className="font-heading text-sm font-semibold">National Math Stars</p>
            <p className="text-xs text-white/60">Parent Portal</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <DemoSwitch view={view} />
          {parent && (
            <div className="flex items-center gap-3">
              <span className="hidden text-sm text-white/80 sm:inline">
                {parent.firstName} {parent.lastName}
              </span>
              <Avatar>
                <AvatarFallback className="bg-brand-gray text-white">
                  {initials(parent.firstName, parent.lastName)}
                </AvatarFallback>
              </Avatar>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

/** Prototype-only switch so reviewers can compare a returning family with a brand-new one. */
function DemoSwitch({ view }: { view: DemoView }) {
  const options: { key: DemoView; href: string; label: string; short: string }[] = [
    { key: "returning", href: "/", label: "Returning family", short: "Returning" },
    { key: "new", href: "/welcome", label: "New family", short: "New" },
  ];
  return (
    <nav
      aria-label="Demo view"
      className="flex items-center gap-1 rounded-full bg-white/10 p-1 text-xs"
    >
      <span className="hidden pl-2 pr-1 text-white/50 md:inline">Demo:</span>
      {options.map((o) => (
        <Link
          key={o.key}
          href={o.href}
          aria-current={view === o.key ? "page" : undefined}
          className={cn(
            "rounded-full px-2.5 py-1 font-medium transition",
            view === o.key ? "bg-brand-gold text-brand-slate" : "text-white/70 hover:text-white",
          )}
        >
          <span className="sm:hidden">{o.short}</span>
          <span className="hidden sm:inline">{o.label}</span>
        </Link>
      ))}
    </nav>
  );
}
