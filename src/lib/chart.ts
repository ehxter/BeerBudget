import { EXPENSE_CATEGORIES, type ExpenseCategory, asCategory } from "./constants";

export type ChartSlice = {
  key: ExpenseCategory;
  label: string;
  emoji: string;
  percent: number;
  totalMinor: number;
  color: string;
};

/**
 * Turns a category → Lira map into the six chart slices, always in the
 * canonical order and always all six, including the empty ones. The pie and
 * the bar chart on Home are two renderings of this one array, which is what
 * keeps their percentages identical.
 */
export function bucketForChart(
  byCategory: Map<string, number>,
  totalMinor: number,
): ChartSlice[] {
  const buckets = new Map<ExpenseCategory, number>(
    EXPENSE_CATEGORIES.map((category) => [category.value, 0]),
  );

  for (const [category, amount] of byCategory) {
    const bucket = asCategory(category);
    buckets.set(bucket, (buckets.get(bucket) ?? 0) + amount);
  }

  return EXPENSE_CATEGORIES.map((category) => {
    const bucketMinor = buckets.get(category.value) ?? 0;
    return {
      key: category.value,
      label: category.label,
      emoji: category.emoji,
      totalMinor: bucketMinor,
      percent: totalMinor > 0 ? (bucketMinor / totalMinor) * 100 : 0,
      color: category.color,
    };
  });
}
