"use client";

import { useOptimistic, useTransition } from "react";
import Link from "next/link";
import { Card, Switch } from "@/components/ui";
import { formatMoney } from "@/lib/money";
import { setRateSource } from "./actions";

/**
 * Who owns the dollar's Toman price: the providers, or you.
 *
 * On is the normal state. Off is for the afternoon the connection dies, or the
 * board in the shop window plainly disagrees with the app — you type one
 * number on the Rates screen and everything else re-derives from it.
 *
 * `useOptimistic` rather than plain state: the switch has to move under the
 * finger immediately, but the server is the authority, and this reverts on its
 * own if the write fails instead of leaving the UI asserting something untrue.
 */
export function RateSourceToggle({
  automatic,
  manualUsdToman,
}: {
  automatic: boolean;
  /** The saved manual dollar price, so "off" can show what it will use. */
  manualUsdToman: number | null;
}) {
  const [optimistic, setOptimistic] = useOptimistic(automatic);
  const [pending, startTransition] = useTransition();

  function handleChange(next: boolean) {
    startTransition(async () => {
      setOptimistic(next);
      await setRateSource(next);
    });
  }

  return (
    <Card pad={16}>
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-row font-medium text-ink-2">Automatic rates</p>
          <p className="mt-0.5 text-meta text-ink-4">
            {optimistic ? (
              "Priced from the rate providers"
            ) : manualUsdToman ? (
              <>
                <span className="tnum">
                  $1 = {formatMoney(manualUsdToman, "TOMAN", { bare: true })} T
                </span>
                {" · "}
                <Link href="/me/rates" className="text-ink-3 underline-offset-2 hover:underline">
                  Edit
                </Link>
              </>
            ) : (
              <Link href="/me/rates" className="text-cat-6 underline-offset-2 hover:underline">
                No rate saved yet — set one
              </Link>
            )}
          </p>
        </div>

        <Switch
          checked={optimistic}
          onChange={handleChange}
          disabled={pending}
          label="Use automatic rates"
        />
      </div>
    </Card>
  );
}
