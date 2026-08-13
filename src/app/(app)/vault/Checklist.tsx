"use client";

import { useOptimistic, useRef, useTransition } from "react";
import { Check, Plus } from "lucide-react";
import { Input, EmptyState, SectionHeader, DeleteButton } from "@/components/ui";
import { toggleChecklistItem, addChecklistItem, deleteChecklistItem } from "./actions";
import { cn } from "@/lib/cn";

type Item = {
  id: string;
  title: string;
  isDone: boolean;
};

type OptimisticAction =
  | { type: "toggle"; id: string }
  | { type: "delete"; id: string };

/** The Vault's first tab. Private to you, like everything else in the app. */
export function Checklist({ items }: { items: Item[] }) {
  const [, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  // Optimistic so a tap feels instant rather than waiting on a round trip.
  const [optimisticItems, dispatchOptimistic] = useOptimistic(
    items,
    (current: Item[], action: OptimisticAction) => {
      if (action.type === "toggle") {
        return current.map((item) =>
          item.id === action.id ? { ...item, isDone: !item.isDone } : item,
        );
      }
      return current.filter((item) => item.id !== action.id);
    },
  );

  function handleToggle(item: Item) {
    startTransition(async () => {
      dispatchOptimistic({ type: "toggle", id: item.id });
      await toggleChecklistItem(item.id, !item.isDone);
    });
  }

  function handleDelete(item: Item) {
    startTransition(async () => {
      dispatchOptimistic({ type: "delete", id: item.id });
      await deleteChecklistItem(item.id);
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
          title="Nothing on your list"
          description="Everything you add here is private to your account."
        />
      ) : (
        <>
          <SectionHeader
            label="Checklist"
            value={`${done} of ${optimisticItems.length} done`}
          />

          <div className="flex flex-col gap-2">
            {optimisticItems.map((item) => (
              <div
                key={item.id}
                className="flex w-full items-center gap-3 rounded-card bg-card p-4"
              >
                <button
                  type="button"
                  onClick={() => handleToggle(item)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors",
                      item.isDone ? "border-action bg-action text-action-ink" : "border-line",
                    )}
                  >
                    {item.isDone ? <Check size={13} strokeWidth={3} /> : null}
                  </span>

                  <span
                    className={cn(
                      "min-w-0 flex-1 truncate text-row transition-colors",
                      item.isDone ? "text-ink-4 line-through" : "text-ink",
                    )}
                  >
                    {item.title}
                  </span>
                </button>

                <DeleteButton
                  label={`Delete ${item.title}`}
                  onDelete={() => handleDelete(item)}
                />
              </div>
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
          className="flex size-12 shrink-0 items-center justify-center rounded-card bg-white/[0.06] text-ink-2 transition-colors active:bg-white/[0.1]"
        >
          <Plus size={18} strokeWidth={2.5} />
        </button>
      </form>
    </div>
  );
}
