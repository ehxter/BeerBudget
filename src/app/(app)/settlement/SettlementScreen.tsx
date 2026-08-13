"use client";

import { useState } from "react";
import { Screen, Button } from "@/components/ui";
import { DebtLedger, type DebtRow } from "./DebtLedger";

/**
 * Owns the composer's open state so the header pill can drive it — the pill
 * sits in the page header, above the ledger, so the state has to live at least
 * this high up.
 */
export function SettlementScreen({
  debts,
  startOpen = false,
}: {
  debts: DebtRow[];
  startOpen?: boolean;
}) {
  const [composing, setComposing] = useState(startOpen);

  return (
    <Screen
      back="/"
      title="Settlement"
      gap={4}
      className="animate-rise"
      action={
        <Button type="button" onClick={() => setComposing(true)}>
          Add Debt
        </Button>
      }
    >
      <DebtLedger
        debts={debts}
        composing={composing}
        onComposingChange={setComposing}
      />
    </Screen>
  );
}
