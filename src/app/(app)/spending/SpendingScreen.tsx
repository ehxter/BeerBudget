"use client";

import { useState } from "react";
import {
  Screen,
  Button,
  ButtonLink,
  EmptyState,
  TabBar,
} from "@/components/ui";
import { ExpenseList, type ExpenseRow } from "./ExpenseList";
import { DebtLedger, type DebtRow } from "../settlement/DebtLedger";

const TABS = [
  { value: "costs", label: "Costs" },
  { value: "settlement", label: "Settlement" },
] as const;

type Tab = (typeof TABS)[number]["value"];

/**
 * Spending, with the debt ledger as a second tab.
 *
 * The header pill changes with the tab — "Add Cost" over the feed, "Add Debt"
 * over the ledger — which is why the tab state lives here rather than inside a
 * self-contained Tabs component: the pill is in the page header, outside the
 * panel it belongs to.
 */
export function SpendingScreen({
  expenses,
  debts,
}: {
  expenses: ExpenseRow[];
  debts: DebtRow[];
}) {
  const [tab, setTab] = useState<Tab>("costs");
  const [composingDebt, setComposingDebt] = useState(false);

  return (
    <Screen
      logo
      gap={4}
      className="animate-rise"
      action={
        tab === "costs" ? (
          <ButtonLink href="/spending/new">Add Cost</ButtonLink>
        ) : (
          <Button type="button" onClick={() => setComposingDebt(true)}>
            Add Debt
          </Button>
        )
      }
    >
      <TabBar tabs={TABS} value={tab} onChange={setTab} />

      <div role="tabpanel">
        {tab === "costs" ? (
          expenses.length === 0 ? (
            <EmptyState
              icon={<span className="text-base">💸</span>}
              title="No costs yet"
              description="Everything you add here counts against the budget on Home."
              action={<ButtonLink href="/spending/new">Add the first one</ButtonLink>}
            />
          ) : (
            <div className="flex flex-col gap-7">
              <ExpenseList expenses={expenses} />
            </div>
          )
        ) : (
          <DebtLedger
            debts={debts}
            composing={composingDebt}
            onComposingChange={setComposingDebt}
          />
        )}
      </div>
    </Screen>
  );
}
