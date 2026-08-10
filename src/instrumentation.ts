/**
 * Runs once when the server boots. Used to start the background exchange-rate
 * refresher so a recent reference price is always on hand — including when the
 * provider goes down between visits to the app.
 */
export async function register() {
  // Only in the Node.js server runtime, and never during `next build`.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NEXT_PHASE === "phase-production-build") return;

  const { startBackgroundRefresh } = await import("@/lib/rates/store");
  startBackgroundRefresh();
}
