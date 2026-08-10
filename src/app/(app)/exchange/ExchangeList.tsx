import { prisma } from "@/lib/prisma";
import { formatMoney, type CurrencyCode } from "@/lib/money";
import { Card, EmptyState } from "@/components/ui";
import { formatDistanceToNowStrict } from "date-fns";

export async function ExchangeList({ tripId }: { tripId: string }) {
  const transactions = await prisma.exchangeTransaction.findMany({
    where: { tripId },
    orderBy: { occurredAt: "desc" },
    include: { user: { select: { name: true } } },
    take: 10,
  });

  if (transactions.length === 0) {
    return (
      <EmptyState
        icon="💸"
        title="No exchanges yet"
        description="Log when you convert cash at a local exchange office to keep track of the rate."
      />
    );
  }

  return (
    <div className="space-y-3">
      {transactions.map((tx) => (
        <Card key={tx.id} className="flex items-center justify-between p-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-ink">
                {formatMoney(tx.toAmountMinor, tx.toCurrency as CurrencyCode)}
              </span>
              <span className="text-xs text-ink-faint">received</span>
            </div>
            <div className="mt-1 text-xs text-ink-muted">
              {formatMoney(tx.fromAmountMinor, tx.fromCurrency as CurrencyCode)} •{" "}
              {tx.effectiveRate.toFixed(4)} rate
            </div>
            {tx.location ? (
              <div className="mt-1 text-xs text-ink-faint">📍 {tx.location}</div>
            ) : null}
            <div className="mt-1 text-[11px] text-ink-faint">
              By {tx.user.name} • {formatDistanceToNowStrict(tx.occurredAt)} ago
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
