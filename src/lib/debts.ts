/**
 * The debt ledger, netted.
 *
 * There is one other party — "your friend" — and no account behind them. The
 * ledger is a private note-to-self about money that is going to move, which is
 * why it belongs in the budget: cash you're owed is cash you'll get to spend,
 * and cash you owe is already gone.
 *
 * A pure function over already-fetched rows, all of them in Lira
 * (`baseAmountMinor`) and converted at the rate that applied when each entry
 * was written.
 */

export type DebtRow = {
  direction: string;
  baseAmountMinor: number;
};

export type DebtBalance = {
  /** What the friend owes the traveler. Raises the budget. */
  theyOweMinor: number;
  /** What the traveler owes the friend. Lowers the budget. */
  iOweMinor: number;
  /** Positive: you're owed, on balance. Negative: you owe. */
  netMinor: number;
};

export function netDebt(debts: DebtRow[]): DebtBalance {
  let theyOweMinor = 0;
  let iOweMinor = 0;

  for (const debt of debts) {
    if (debt.direction === "I_OWE") iOweMinor += debt.baseAmountMinor;
    else theyOweMinor += debt.baseAmountMinor;
  }

  return { theyOweMinor, iOweMinor, netMinor: theyOweMinor - iOweMinor };
}
