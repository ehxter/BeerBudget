"use client";

import { useOffline } from "next/offline";
import { CloudOff } from "lucide-react";

/**
 * Connectivity indicator.
 *
 * With `experimental.useOffline` enabled, Next also queues blocked navigations
 * and Server Actions and retries them once the connection returns — so an
 * expense saved in a basement restaurant lands when you get back outside.
 * This banner is the visible half of that behaviour.
 */
export function OfflineBanner() {
  const isOffline = useOffline();

  if (!isOffline) return null;

  return (
    <div
      role="status"
      className="animate-fade-in sticky top-0 z-30 flex items-center justify-center gap-2 border-b border-warn/20 bg-warn-soft px-4 py-2 text-xs font-medium text-warn"
    >
      <CloudOff size={14} />
      Offline — showing saved data. Changes will sync when you reconnect.
    </div>
  );
}
