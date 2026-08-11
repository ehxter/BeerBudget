"use client";

import { useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import {
  Card,
  Input,
  Textarea,
  SubmitButton,
  FormError,
  EmptyState,
  Button,
  CardButton,
} from "@/components/ui";
import { addPrivateNote } from "./actions";

type Note = { id: string; title: string; content: string; updatedAt: Date };

export function PrivateNotes({ notes }: { notes: Note[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState("");
  const [composing, setComposing] = useState(false);

  async function handleAction(formData: FormData) {
    const result = await addPrivateNote({}, formData);
    if (result.error) {
      setError(result.error);
      return;
    }
    setError("");
    formRef.current?.reset();
    setComposing(false);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* The composer stays folded away so the tab opens on the notes
          themselves rather than on an empty form. */}
      {composing ? (
        <form ref={formRef} action={handleAction} className="animate-rise flex flex-col gap-4">
          <FormError>{error}</FormError>
          <Card pad={16}>
            <Input name="title" placeholder="Title" required maxLength={120} autoFocus />
            <Textarea name="content" placeholder="Write something private…" required />
          </Card>
          <div className="flex gap-2">
            <SubmitButton size="block" className="flex-1" pendingLabel="Saving…">
              Save note
            </SubmitButton>
            <Button
              type="button"
              variant="quiet"
              onClick={() => setComposing(false)}
              aria-label="Cancel"
              className="w-12 px-0"
            >
              <X size={17} />
            </Button>
          </div>
        </form>
      ) : (
        <CardButton onClick={() => setComposing(true)}>
          <Plus size={16} className="mr-1.5" />
          New note
        </CardButton>
      )}

      {notes.length === 0 ? (
        <EmptyState
          icon={<span className="text-base">🔏</span>}
          title="No notes yet"
          description="Anything you jot down here stays on your account only."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {notes.map((note) => (
            <Card key={note.id} pad={16} className="gap-2">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="truncate text-row font-medium text-ink">{note.title}</h3>
                <time className="shrink-0 text-label text-ink-5">
                  {note.updatedAt.toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                  })}
                </time>
              </div>
              <p className="whitespace-pre-wrap text-meta leading-relaxed text-ink-3">
                {note.content}
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
