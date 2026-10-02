import { Star } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { initials } from "@/lib/format";
import type { Parent } from "@/lib/types";

export function SiteHeader({ parent }: { parent?: Parent }) {
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
    </header>
  );
}
