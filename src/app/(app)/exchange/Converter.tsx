"use client";

import { useState, useMemo } from "react";
import { ArrowRightLeft } from "lucide-react";
import { Card, ChoiceChips, Input } from "@/components/ui";
import { CURRENCIES, CURRENCY_META, type CurrencyCode, formatMoney, convertMinor, parseAmountToMinor } from "@/lib/money";

export function Converter({
  baseCurrency,
  tomanPerUnit,
}: {
  baseCurrency: CurrencyCode;
  tomanPerUnit: Record<CurrencyCode, number>;
}) {
  const [amount, setAmount] = useState("");
  const [fromCurrency, setFromCurrency] = useState<CurrencyCode>(baseCurrency);
  const [toCurrency, setToCurrency] = useState<CurrencyCode>("TOMAN");

  const amountMinor = parseAmountToMinor(amount, fromCurrency) ?? 0;

  const rate = useMemo(() => {
    const from = tomanPerUnit[fromCurrency];
    const to = tomanPerUnit[toCurrency];
    if (!from || !to) return 1;
    return from / to;
  }, [fromCurrency, toCurrency, tomanPerUnit]);

  const convertedMinor = convertMinor(amountMinor, fromCurrency, toCurrency, rate);

  function swapCurrencies() {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  }

  return (
    <Card className="space-y-4">
      <div className="flex items-baseline gap-2">
        {CURRENCY_META[fromCurrency].position === "prefix" ? (
          <span className="text-3xl font-semibold text-ink-faint">
            {CURRENCY_META[fromCurrency].symbol}
          </span>
        ) : null}
        <input
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          inputMode="decimal"
          placeholder="0"
          aria-label="Amount to convert"
          className="tnum w-full min-w-0 bg-transparent text-4xl font-bold tracking-tight text-ink outline-none placeholder:text-ink-faint/40"
        />
        {CURRENCY_META[fromCurrency].position === "suffix" ? (
          <span className="text-2xl font-semibold text-ink-faint">
            {CURRENCY_META[fromCurrency].symbol}
          </span>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1">
          <ChoiceChips
            name="fromCurrency"
            options={CURRENCIES.map((code) => ({
              value: code,
              label: code === "TOMAN" ? "Toman" : code,
            }))}
            value={fromCurrency}
            onChange={setFromCurrency}
            columns={2}
          />
        </div>
        <button
          onClick={swapCurrencies}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-2 text-ink hover:bg-surface-3 transition-colors"
          aria-label="Swap currencies"
        >
          <ArrowRightLeft size={16} />
        </button>
        <div className="flex-1">
          <ChoiceChips
            name="toCurrency"
            options={CURRENCIES.map((code) => ({
              value: code,
              label: code === "TOMAN" ? "Toman" : code,
            }))}
            value={toCurrency}
            onChange={setToCurrency}
            columns={2}
          />
        </div>
      </div>

      <div className="pt-4 border-t border-surface-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-faint mb-1">
          Reference rate conversion
        </p>
        <div className="text-2xl font-semibold text-ink">
          {amountMinor > 0 ? formatMoney(convertedMinor, toCurrency) : "—"}
        </div>
        <p className="mt-1 text-xs text-ink-faint">
          1 {fromCurrency} = {rate.toFixed(2)} {toCurrency}
        </p>
      </div>
    </Card>
  );
}
