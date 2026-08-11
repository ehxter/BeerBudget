"use client";

import { useOptimistic, useRef, useTransition } from "react";
import { Check, Plus } from "lucide-react";
import { Input, EmptyState, SectionHeader } from "@/components/ui";
import { toggleChecklistItem, addChecklistItem } from "./actions";
import { cn } from "@/lib/cn";

type Item = {
  id: string;
  title: string;
  isDone: boolean;
  completedBy: { name: string } | null;
};

export function Checklist({ items }: { items: Item[] }) {
  const [, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  // Optimistic so a tap feels instant. Previously every row dimmed on any
  // toggle, which made one tap look like the whole list reloading.
  const [optimisticItems, setOptimistic] = useOptimistic(
    items,
    (current: Item[], id: string) =>
      current.map((item) =>
        item.id === id ? { ...item, isDone: !item.isDone } : item,
      ),
  );

  function handleToggle(item: Item) {
    startTransition(async () => {
      setOptimistic(item.id);
      await toggleChecklistItem(item.id, !item.isDone);
    });
  }

  async function handleAdd(formData: FormData) {
    formRef.current?.reset();
    await addChecklistItem({}, formData);
  }

  const done = optimisticItems.filter((item) => item.isDone).length;

  return (
    <div className="flex flex-col gap-2.5">
      {optimisticItems.length === 0 ? (
        <EmptyState
          icon={<span className="text-base">☑</span>}
          title="Nothing on the list"
          description="Add what you need to sort out before or during the trip."
        />
      ) : (
        <>
          <SectionHeader
            label="Checklist"
            value={`${done} of ${optimisticItems.length} done`}
          />

          <div className="flex flex-col gap-2">
            {optimisticItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleToggle(item)}
                className="flex w-full items-center gap-3 rounded-card bg-card p-4 text-left active:bg-track"
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors",
                    item.isDone
                      ? "border-action bg-action text-action-ink"
                      : "border-line",
                  )}
                >
                  {item.isDone ? <Check size={13} strokeWidth={3} /> : null}
                </span>

                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      "block truncate text-row transition-colors",
                      item.isDone ? "text-ink-4 line-through" : "text-ink",
                    )}
                  >
                    {item.title}
                  </span>
                  {/* Both travelers can see who ticked an item off. */}
                  {item.isDone && item.completedBy ? (
                    <span className="mt-0.5 block truncate text-label text-ink-5">
                      {item.completedBy.name}
                    </span>
                  ) : null}
                </span>
              </button>
            ))}
          </div>
        </>
      )}

      <form ref={formRef} action={handleAdd} className="mt-2 flex gap-2">
        <Input
          name="title"
          placeholder="Add an item"
          required
          maxLength={120}
          autoComplete="off"
        />
        <button
          type="submit"
          aria-label="Add item"
          className="flex size-12 shrink-0 items-center justify-center rounded-card bg-action text-action-ink active:bg-action/85"
        >
          <Plus size={18} strokeWidth={2.5} />
        </button>
      </form>
    </div>
  );
}
