"use client";

import { Trash } from "lucide-react";

export function ExpenseActions({ id, description }: { id: string; description: string }) {
  return (
    <button className="text-ink-faint hover:text-negative transition-colors mt-2" title={`Delete ${description}`}>
      <Trash size={14} />
    </button>
  );
}
