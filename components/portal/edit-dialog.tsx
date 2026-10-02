"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface EditField<K extends string> {
  name: K;
  label: string;
  type?: "text" | "email" | "tel" | "number";
  required?: boolean;
}

interface EditDialogProps<K extends string> {
  title: string;
  description?: string;
  fields: EditField<K>[];
  values: Record<K, string>;
  onSave: (values: Record<K, string>) => Promise<void>;
}

/** Edit button + modal form for a flat set of string fields. */
export function EditDialog<K extends string>({
  title,
  description,
  fields,
  values,
  onSave,
}: EditDialogProps<K>) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(values);
  const [saving, setSaving] = useState(false);

  function handleOpenChange(next: boolean) {
    if (next) setDraft(values); // start from the latest saved values each time
    setOpen(next);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(draft);
      toast.success(`${title} saved`);
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <Pencil data-icon="inline-start" />
        Edit
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>Edit {title.toLowerCase()}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>

          <div className="grid gap-3">
            {fields.map((field) => (
              <div key={field.name} className="grid gap-1.5">
                <Label htmlFor={`edit-${field.name}`}>{field.label}</Label>
                <Input
                  id={`edit-${field.name}`}
                  type={field.type ?? "text"}
                  required={field.required ?? true}
                  value={draft[field.name]}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, [field.name]: e.target.value }))
                  }
                />
              </div>
            ))}
          </div>

          <DialogFooter>
            <DialogClose render={<Button variant="outline" type="button" />}>
              Cancel
            </DialogClose>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
