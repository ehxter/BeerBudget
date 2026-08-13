"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // Registering in dev means every route/bundle change this session gets
    // cache-first served stale until the browser gets around to an update
    // check — "nothing works" after an edit that actually landed fine.
    // Unregister instead, so a dev browser never has one running.
    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) registration.unregister();
      });
      return;
    }

    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.error("Service worker registration failed", err);
      });
    });
  }, []);

  return null;
}
