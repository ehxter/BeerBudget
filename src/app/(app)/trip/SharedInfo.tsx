import { Card, EmptyState } from "@/components/ui";
import { SHARED_INFO_CATEGORIES, emojiFor } from "@/lib/constants";

type SharedInfoItem = {
  id: string;
  title: string;
  category: string;
  content: string;
};

export function SharedInfo({ items }: { items: SharedInfoItem[] }) {
  // An empty tab must still say something — returning null rendered a blank
  // screen that read as a broken page.
  if (items.length === 0) {
    return (
      <EmptyState
        icon={<span className="text-base">📌</span>}
        title="No shared info yet"
        description="Hotel address, flight numbers, meeting points — whatever you both need to reach fast."
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => (
        <Card key={item.id} pad={16} className="gap-2">
          <div className="flex items-center gap-2">
            <span aria-hidden="true" className="text-meta">
              {emojiFor(SHARED_INFO_CATEGORIES, item.category)}
            </span>
            <h3 className="text-row font-medium text-ink">{item.title}</h3>
          </div>
          <p className="whitespace-pre-wrap text-meta leading-relaxed text-ink-3">
            {item.content}
          </p>
        </Card>
      ))}
    </div>
  );
}
