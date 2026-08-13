import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * The project's type scale, from the `--text-*` tokens in globals.css.
 *
 * tailwind-merge has to be told about these. It resolves a bare `text-<x>`
 * against Tailwind's *default* font-size scale (sm, lg, 2xl, …), and anything
 * it doesn't recognise it files under text-*colour* instead. So
 * `cn("text-caps … text-ink-5")` looked like two colours in a row, and merging
 * dropped the first — silently deleting the font size and leaving the element
 * to inherit 16px from the body.
 *
 * Keep this list in sync with the `--text-*` tokens in globals.css. A size
 * that's missing here doesn't error; it just stops applying wherever a colour
 * class follows it, which is a hard bug to see.
 */
const FONT_SIZES = [
  "display",
  "figure",
  "title",
  "row",
  "meta",
  "cat",
  "caps",
  "label",
] as const;

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: [...FONT_SIZES] }],
    },
  },
});

/** Merge Tailwind classes so later utilities win over earlier conflicting ones. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
