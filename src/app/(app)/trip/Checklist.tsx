"use client";

import { useTransition, useRef } from "react";
import { Check, Plus } from "lucide-react";
import { Card, Input } from "@/components/ui";
import { toggleChecklistItem, addChecklistItem } from "./actions";
import { cn } from "@/lib/cn";

type ChecklistProps = {
  items: {
    id: string;
    title: string;
    isDone: boolean;
  }[];
};

export function Checklist({ items }: ChecklistProps) {
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleToggle(id: string, currentIsDone: boolean) {
    startTransition(() => {
      toggleChecklistItem(id, !currentIsDone);
    });
  }

  async function handleAdd(formData: FormData) {
    await addChecklistItem({}, formData);
    formRef.current?.reset();
  }

  return (
    <Card className="space-y-4">
      <div className="space-y-1">
        {items.map((item) => (
          <label
            key={item.id}
            className={cn(
              "flex items-center gap-3 py-2 transition-opacity",
              isPending && "opacity-70"
            )}
          >
            <div className="relative flex items-center justify-center">
              <input
                type="checkbox"
                checked={item.isDone}
                onChange={() => handleToggle(item.id, item.isDone)}
                className="peer h-5 w-5 appearance-none rounded border border-ink-muted/30 bg-transparent checked:border-brand checked:bg-brand focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-1 focus:ring-offset-surface"
              />
              <Check
                size={14}
                strokeWidth={3}
                className="pointer-events-none absolute text-surface opacity-0 peer-checked:opacity-100"
              />
            </div>
            <span
              className={cn(
                "text-sm font-medium transition-colors",
                item.isDone ? "text-ink-faint line-through" : "text-ink"
              )}
            >
              {item.title}
            </span>
          </label>
        ))}
      </div>

      <form ref={formRef} action={handleAdd} className="flex gap-2 pt-2 border-t border-surface-2">
        <Input name="title" placeholder="Add new item..." className="h-9 text-sm" required />
        <button
          type="submit"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-brand text-surface hover:bg-brand/90 transition-colors"
        >
          <Plus size={16} />
        </button>
      </form>
    </Card>
  );
}
