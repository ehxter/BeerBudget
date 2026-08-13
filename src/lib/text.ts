/**
 * Writing-direction detection, for text the app can't know the language of in
 * advance — notes are typed in whatever language the traveler is thinking in.
 */

export type TextDirection = "ltr" | "rtl";

// Persian and Arabic share the Arabic script block, which also covers the
// Extended Arabic-Indic digits (۰-۹) a Farsi keyboard produces. Hebrew is in
// here because it costs nothing and the alternative is silently mis-rendering
// it.
const RTL_LETTERS = /[\p{Script=Arabic}\p{Script=Hebrew}]/gu;
const LTR_LETTERS = /[\p{Script=Latin}\p{Script=Cyrillic}\p{Script=Greek}]/gu;

function count(text: string, pattern: RegExp): number {
  // The global regexes are module-level, so reset lastIndex before each scan.
  pattern.lastIndex = 0;
  let total = 0;
  while (pattern.exec(text) !== null) total += 1;
  return total;
}

/**
 * Picks a direction by which script the text is mostly written in.
 *
 * The browser's own `dir="auto"` looks only at the *first* strong character,
 * which gets a mixed note wrong in the common case — "Wifi password: رمز عبور"
 * is Farsi text with an English label on the front, and reading it left to
 * right puts the Persian in the wrong place. Counting characters instead means
 * the majority language wins, whichever end it starts at.
 *
 * Ties and text with no letters at all (a bare number, an address, an empty
 * draft) stay LTR, which is what the rest of the UI is.
 */
export function detectDirection(text: string): TextDirection {
  if (!text) return "ltr";
  return count(text, RTL_LETTERS) > count(text, LTR_LETTERS) ? "rtl" : "ltr";
}
