"use client";

import { useState, useActionState, useEffect } from "react";
import { Card, ProgressBar, Input, ChoiceChips, SubmitButton, FormError } from "@/components/ui";
import { formatMoney, type CurrencyCode, CURRENCIES } from "@/lib/money";
import { updateBudget, type ActionState } from "./actions";
import { Settings2, X } from "lucide-react";

type BudgetTrackerProps = {
  budgetMinor: number;
  budgetCurrency: CurrencyCode;
  spentMinor: number;
};

export function BudgetTracker({ budgetMinor, budgetCurrency, spentMinor }: BudgetTrackerProps) {
  const [isEditing, setIsEditing] = useState(budgetMinor === 0);
  const [currency, setCurrency] = useState<CurrencyCode>(budgetCurrency);
  const [state, formAction] = useActionState(updateBudget, {});

  useEffect(() => {
    if (state.ok && budgetMinor !== 0) {
      setIsEditing(false);
    }
  }, [state.ok, budgetMinor]);

  if (isEditing) {
    return (
      <Card className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-ink">Set Personal Budget</h3>
          {budgetMinor > 0 && (
            <button onClick={() => setIsEditing(false)} className="text-ink-faint hover:text-ink">
              <X size={18} />
            </button>
          )}
        </div>
        <form action={formAction} className="space-y-4">
          <FormError>{state.error}</FormError>
          <div>
            <span className="mb-1.5 block text-xs font-medium text-ink-muted">Amount</span>
            <Input 
              name="amount" 
              inputMode="decimal" 
              defaultValue={budgetMinor > 0 ? formatMoney(budgetMinor, budgetCurrency, { bare: true, showDecimals: false }).replace(/,/g, "") : ""} 
              placeholder="e.g. 500" 
              required 
            />
          </div>
          <div>
            <span className="mb-1.5 block text-xs font-medium text-ink-muted">Currency</span>
            <ChoiceChips
              name="currency"
              options={CURRENCIES.map(code => ({ value: code, label: code === "TOMAN" ? "Toman" : code }))}
              value={currency}
              onChange={setCurrency}
              columns={4}
            />
          </div>
          <SubmitButton className="w-full">Save Budget</SubmitButton>
        </form>
      </Card>
    );
  }

  const remaining = budgetMinor - spentMinor;
  const percentage = Math.min(100, Math.max(0, (spentMinor / budgetMinor) * 100));
  
  const isOverBudget = remaining < 0;

  return (
    <Card className="p-4 space-y-4 relative">
      <button 
        onClick={() => setIsEditing(true)} 
        className="absolute top-4 right-4 text-ink-faint hover:text-ink transition-colors"
        aria-label="Edit Budget"
      >
        <Settings2 size={16} />
      </button>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
            Remaining
          </p>
          <p className={`text-2xl font-bold mt-1 ${isOverBudget ? 'text-negative' : 'text-positive'}`}>
            {isOverBudget ? '- ' : ''}
            {formatMoney(Math.abs(remaining), budgetCurrency)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
            Personal Spent
          </p>
          <p className="text-sm font-semibold text-ink mt-1">
            {formatMoney(spentMinor, budgetCurrency)}
          </p>
        </div>
      </div>

      <ProgressBar 
        percent={percentage} 
        tone={isOverBudget ? "negative" : percentage > 85 ? "warn" : "positive"} 
      />
      
      <p className="text-[11px] text-ink-faint text-center">
        Budget limit: {formatMoney(budgetMinor, budgetCurrency)}
      </p>
    </Card>
  );
}
