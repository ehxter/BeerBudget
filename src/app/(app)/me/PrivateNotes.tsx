"use client";

import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Card, Input, Textarea, SubmitButton, FormError } from "@/components/ui";
import { addPrivateNote } from "./actions";

type Note = {
  id: string;
  title: string;
  content: string;
  updatedAt: Date;
};

export function PrivateNotes({ notes }: { notes: Note[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState("");

  async function handleAction(formData: FormData) {
    const res = await addPrivateNote({}, formData);
    if (res.error) {
      setError(res.error);
    } else {
      setError("");
      formRef.current?.reset();
    }
  }

  return (
    <div className="space-y-4">
      <form ref={formRef} action={handleAction} className="space-y-3">
        <FormError>{error}</FormError>
        <Card className="space-y-3 p-4 bg-surface-2/50 border-dashed border-2 border-surface-3 shadow-none">
          <Input name="title" placeholder="Note title" required className="bg-surface" />
          <Textarea name="content" placeholder="Write something private..." required className="bg-surface min-h-[80px]" />
          <SubmitButton className="w-full">Save Note</SubmitButton>
        </Card>
      </form>

      <div className="space-y-3">
        {notes.map((note) => (
          <Card key={note.id} className="p-4 space-y-2">
            <div className="flex items-center justify-between border-b border-surface-2 pb-2">
              <h3 className="font-semibold text-ink">{note.title}</h3>
              <span className="text-[10px] text-ink-faint uppercase tracking-wider">
                {new Date(note.updatedAt).toLocaleDateString()}
              </span>
            </div>
            <div className="text-sm text-ink-muted whitespace-pre-wrap">
              {note.content}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
