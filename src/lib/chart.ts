import {
  CHART_CATEGORY_ORDER,
  CHART_CATEGORY_COLOR,
  EXPENSE_CATEGORIES,
  labelFor,
  toChartCategory,
} from "./constants";

export type ChartSlice = {
  key: string;
  label: string;
  percent: number;
  totalMinor: number;
  color: string;
};

/**
 * Buckets a category → amount map into the six fixed chart slices (Food,
 * Drinks, Transport, Activities, Shopping, Other), always in that order.
 * Categories outside the six (Stay, Groceries) fold into Other for the
 * chart only — they keep their own identity everywhere else.
 */
export function bucketForChart(
  byCategory: Map<string, number>,
  totalMinor: number,
): ChartSlice[] {
  const buckets = new Map<string, number>(CHART_CATEGORY_ORDER.map((key) => [key, 0]));

  for (const [category, amount] of byCategory) {
    const bucket = toChartCategory(category);
    buckets.set(bucket, (buckets.get(bucket) ?? 0) + amount);
  }

  return CHART_CATEGORY_ORDER.map((key) => {
    const bucketMinor = buckets.get(key) ?? 0;
    return {
      key,
      label: labelFor(EXPENSE_CATEGORIES, key),
      totalMinor: bucketMinor,
      percent: totalMinor > 0 ? (bucketMinor / totalMinor) * 100 : 0,
      color: CHART_CATEGORY_COLOR[key as keyof typeof CHART_CATEGORY_COLOR],
    };
  });
}
