import { prisma } from "@/lib/prisma";
import { asCurrency, formatMoney, formatRate } from "@/lib/money";
import { CostItem, Dot, EmptyState } from "@/components/ui";
import { relativeTimeAgo } from "@/lib/format";

export async function ExchangeList({ userId }: { userId: string }) {
  const transactions = await prisma.exchangeTransaction.findMany({
    where: { userId },
    orderBy: { occurredAt: "desc" },
    take: 100,
  });

  if (transactions.length === 0) {
    return (
      <EmptyState
        icon={<span className="text-base">💵</span>}
        title="No exchanges logged"
        description="Record what you actually got at the counter to keep a real rate on hand."
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {transactions.map((tx) => {
        const from = asCurrency(tx.fromCurrency);
        const to = asCurrency(tx.toCurrency);

        return (
          <CostItem
            key={tx.id}
            title={
              <>
                {formatMoney(tx.fromAmountMinor, from)}
                <span className="mx-1.5 text-ink-4">→</span>
                {formatMoney(tx.toAmountMinor, to)}
              </>
            }
            meta={relativeTimeAgo(tx.occurredAt)}
            amount={formatRate(tx.effectiveRate)}
            sub={`${to === "TOMAN" ? "TMN" : to}/${from === "TOMAN" ? "TMN" : from}`}
            footer={
              tx.location ? (
                <>
                  {tx.location}
                  {tx.note ? (
                    <>
                      <Dot />
                      {tx.note}
                    </>
                  ) : null}
                </>
              ) : null
            }
          />
        );
      })}
    </div>
  );
}
