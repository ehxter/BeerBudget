"use client";

import { useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import { Card, Divider, CurrencyChips } from "@/components/ui";
import {
  CURRENCIES,
  CURRENCY_META,
  type CurrencyCode,
  formatMoney,
  formatRate,
  convertMinor,
  parseAmountToMinor,
} from "@/lib/money";

const CHIPS = CURRENCIES.map((code) => ({
  value: code,
  // Figma abbreviates Toman to TMN on the chips.
  label: code === "TOMAN" ? "TMN" : code,
}));

/**
 * Converter from the Figma Exchange frame: a 32px amount, two 2x2 grids of
 * 59px circular currency chips with a swap control between them, a hairline,
 * then the converted figure at 24px and the rate underneath.
 */
export function Converter({
  baseCurrency,
  tomanPerUnit,
}: {
  baseCurrency: CurrencyCode;
  tomanPerUnit: Record<CurrencyCode, number>;
}) {
  const [amount, setAmount] = useState("");
  const [from, setFrom] = useState<CurrencyCode>(baseCurrency);
  const [to, setTo] = useState<CurrencyCode>("TOMAN");

  const amountMinor = parseAmountToMinor(amount, from) ?? 0;

  const fromToman = tomanPerUnit[from];
  const toToman = tomanPerUnit[to];
  const rate = fromToman && toToman ? fromToman / toToman : 0;
  const convertedMinor = convertMinor(amountMinor, from, to, rate);

  return (
    // 20 rather than the Figma's 16: the extra room is worth the ~4px it takes
    // off each currency chip, which stays well above a comfortable tap target.
    <Card pad={20}>
      <div className="flex items-baseline gap-1.5 py-1">
        <span className="text-display font-bold text-ink-5">
          {CURRENCY_META[from].symbol}
        </span>
        <input
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          inputMode="decimal"
          placeholder="0"
          aria-label="Amount to convert"
          className="tnum w-full min-w-0 bg-transparent text-display font-bold text-ink outline-none placeholder:text-ink-5"
        />
      </div>

      {/* items-stretch (not items-center) so the swap button fills the row's
          real height. No explicit height on the button itself — a flex row
          with an auto (content-driven) height only stretches children whose
          own cross-size is auto too; a percentage height like h-full doesn't
          resolve against an auto-height container and quietly collapses to
          the button's own content size instead. */}
      <div className="flex items-stretch gap-2.5">
        <div className="min-w-0 flex-1">
          <CurrencyChips options={CHIPS} value={from} onChange={setFrom} />
        </div>

        <button
          type="button"
          onClick={() => {
            setFrom(to);
            setTo(from);
          }}
          aria-label="Swap currencies"
          className="flex w-[59px] shrink-0 items-center justify-center rounded-pill bg-track text-ink-3 active:bg-fill"
        >
          <ArrowLeftRight size={20} />
        </button>

        <div className="min-w-0 flex-1">
          <CurrencyChips options={CHIPS} value={to} onChange={setTo} />
        </div>
      </div>

      <Divider />

      <div className="flex flex-col gap-0.5 pb-1 pl-1">
        <div className="flex items-baseline gap-1.5">
          <span className="text-figure font-bold text-ink-5">
            {CURRENCY_META[to].symbol}
          </span>
          <span className="tnum text-figure font-bold text-ink">
            {amountMinor > 0 ? formatMoney(convertedMinor, to, { bare: true }) : "0"}
          </span>
        </div>
        <p className="text-meta text-ink-4">
          {/* formatRate scales its precision, so a Toman→Lira rate doesn't
              collapse to "0.00". */}
          1 {from === "TOMAN" ? "TOMAN" : from} = {formatRate(rate)}{" "}
          {to === "TOMAN" ? "TOMAN" : to}
        </p>
      </div>
    </Card>
  );
}
