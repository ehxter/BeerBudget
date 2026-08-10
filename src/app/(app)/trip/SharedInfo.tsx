import { Card } from "@/components/ui";
import { SHARED_INFO_CATEGORIES, emojiFor } from "@/lib/constants";

type SharedInfoItem = {
  id: string;
  title: string;
  category: string;
  content: string;
};

export function SharedInfo({ items }: { items: SharedInfoItem[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <Card key={item.id} className="p-4 space-y-2">
          <div className="flex items-center gap-2 border-b border-surface-2 pb-2">
            <span className="text-xl">{emojiFor(SHARED_INFO_CATEGORIES, item.category)}</span>
            <h3 className="font-semibold text-ink">{item.title}</h3>
          </div>
          <div className="text-sm text-ink-muted whitespace-pre-wrap">
            {item.content}
          </div>
        </Card>
      ))}
    </div>
  );
}
