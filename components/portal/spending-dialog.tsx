"use client";

import { useEffect, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { getBudget, getBudgetSummary } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { formatCents, percentOf } from "@/lib/money";
import type { Budget, BudgetSummary } from "@/lib/types";

interface SpendingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** What the family budget has been spent on: totals by category, then every purchase. */
export function SpendingDialog({ open, onOpenChange }: SpendingDialogProps) {
  const [data, setData] = useState<{ budget: Budget; summary: BudgetSummary } | null>(null);

  useEffect(() => {
    if (!open) return;
    let active = true;
    Promise.all([getBudget(), getBudgetSummary()]).then(([budget, summary]) => {
      if (active) setData({ budget, summary });
    });
    return () => {
      active = false;
    };
  }, [open]);

  const transactions = data
    ? [...data.budget.transactions].sort((a, b) => b.date.localeCompare(a.date))
    : [];
  const largest = data?.summary.byCategory[0]?.amountCents ?? 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg">Where the budget has gone</DialogTitle>
          <DialogDescription>
            {data
              ? `${data.budget.fiscalYear} STEM enrichment budget · ${formatCents(data.summary.remainingCents)} left of ${formatCents(data.summary.maxCents)}. Courses and summer camp are paid by NMS separately.`
              : "Loading…"}
          </DialogDescription>
        </DialogHeader>

        {!data ? (
          <Skeleton className="h-72" />
        ) : (
          <div className="grid gap-5">
            <section className="grid gap-2.5" aria-label="Spending by category">
              {data.summary.byCategory.map(({ category, amountCents }) => (
                <div key={category} className="grid gap-1">
                  <div className="flex justify-between text-sm">
                    <span>{category}</span>
                    <span className="font-medium tabular-nums">{formatCents(amountCents)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-brand-gold"
                      style={{ width: `${percentOf(amountCents, largest)}%` }}
                    />
                  </div>
                </div>
              ))}
            </section>

            <Separator />

            <section aria-label="All purchases">
              <ul className="grid gap-3">
                {transactions.map((t) => (
                  <li key={t.id} className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium leading-snug">{t.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.vendor} · {formatDate(t.date)}
                        {t.status === "pending" && (
                          <span className="ml-1.5 rounded-full bg-accent px-1.5 py-0.5 font-medium text-brand-ink">
                            Pending
                          </span>
                        )}
                      </p>
                    </div>
                    <span className="shrink-0 font-medium tabular-nums">
                      {formatCents(t.amountCents)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
