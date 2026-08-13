"use client";

import { useOptimistic, useRef, useState, useTransition } from "react";
import { Check, X } from "lucide-react";
import {
  Card,
  CardLabel,
  Divider,
  Textarea,
  Button,
  SubmitButton,
  EmptyState,
  SectionHeader,
  DeleteButton,
} from "@/components/ui";
import { relativeDay, clockTime } from "@/lib/format";
import { detectDirection } from "@/lib/text";
import { addNote, updateNote, deleteNote } from "./actions";

export type NoteRow = {
  id: string;
  body: string;
  updatedAt: Date;
};

/**
 * The Vault's third tab: free-form text, no title.
 *
 * A note is whatever you typed, so the card shows the body itself rather than
 * a name you'd have had to invent first. Editing happens in place — the same
 * textarea, in the same spot — so a quick fix doesn't take you to another
 * screen and back.
 *
 * Farsi is a first-class case here rather than an afterthought: direction is
 * detected per note from the text itself, and the composer flips as you type,
 * so switching languages mid-list needs no setting and no thought.
 */
export function Notes({ notes }: { notes: NoteRow[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [, startTransition] = useTransition();
  const [error, setError] = useState("");
  // Controlled so the textarea can turn itself around while you're still
  // typing, instead of after the note is saved.
  const [draft, setDraft] = useState("");

  const [optimistic, removeOptimistic] = useOptimistic(
    notes,
    (current: NoteRow[], id: string) => current.filter((note) => note.id !== id),
  );

  async function handleAdd(formData: FormData) {
    const result = await addNote({}, formData);
    if (result.error) {
      setError(result.error);
      return;
    }
    setError("");
    formRef.current?.reset();
    setDraft("");
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      removeOptimistic(id);
      await deleteNote(id);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <form ref={formRef} action={handleAdd} className="flex flex-col gap-4">
        <Card pad={20}>
          <CardLabel>New note</CardLabel>
          <Textarea
            name="body"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            dir={detectDirection(draft)}
            required
            maxLength={5000}
            placeholder="Anything worth keeping — no title needed"
            aria-label="Note"
          />
          {error ? <p className="text-meta text-cat-6">{error}</p> : null}
        </Card>

        <SubmitButton size="block" pendingLabel="Saving…">
          Save note
        </SubmitButton>
      </form>

      {optimistic.length === 0 ? (
        <EmptyState
          icon={<span className="text-base">📝</span>}
          title="No notes yet"
          description="Door codes, addresses, the name of that restaurant — whatever you'd otherwise text yourself."
        />
      ) : (
        <section className="flex flex-col gap-2.5">
          <SectionHeader label="Notes" value={`${optimistic.length}`} />

          <div className="flex flex-col gap-2">
            {optimistic.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onDelete={() => handleDelete(note.id)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function NoteCard({ note, onDelete }: { note: NoteRow; onDelete: () => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(note.body);
  const [pending, startTransition] = useTransition();

  function handleSave() {
    const body = draft.trim();
    if (!body) return;

    startTransition(async () => {
      await updateNote(note.id, body);
      setEditing(false);
    });
  }

  if (editing) {
    return (
      <div className="flex flex-col gap-4 rounded-card bg-card p-4">
        <Textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          dir={detectDirection(draft)}
          maxLength={5000}
          autoFocus
          aria-label="Edit note"
        />
        <div className="flex gap-2">
          <Button
            type="button"
            size="block"
            className="flex-1"
            onClick={handleSave}
            disabled={pending || draft.trim() === ""}
          >
            <Check size={15} />
            {pending ? "Saving…" : "Save"}
          </Button>
          <Button
            type="button"
            variant="quiet"
            aria-label="Cancel editing"
            onClick={() => {
              setDraft(note.body);
              setEditing(false);
            }}
          >
            <X size={16} />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-card bg-card p-4">
      {/* pre-wrap so line breaks the user typed survive, without letting a
          long unbroken string push the card wider than the screen. `dir`
          drives the alignment on its own: text-align defaults to `start`,
          which follows the direction rather than fighting it. */}
      <p
        dir={detectDirection(note.body)}
        className="whitespace-pre-wrap break-words text-row leading-relaxed text-ink"
      >
        {note.body}
      </p>

      <Divider />

      <div className="flex items-center justify-between gap-4">
        <span className="truncate text-meta text-ink-4">
          {relativeDay(note.updatedAt)} · {clockTime(note.updatedAt)}
        </span>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded-full px-3 py-1 text-meta font-medium text-ink-4 transition-colors active:bg-white/[0.06] active:text-ink"
          >
            Edit
          </button>
          <DeleteButton label="Delete note" onDelete={onDelete} />
        </div>
      </div>
    </div>
  );
}
