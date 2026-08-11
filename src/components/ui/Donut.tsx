/**
 * Spending donut. Figma: 156x156 ellipse arcs, innerRadius 0.58 — so the ring
 * is ~33px thick — with a thin card-coloured gap between segments.
 *
 * Drawn as a single SVG circle per slice using stroke-dasharray, which keeps
 * the arithmetic honest and avoids hand-authored path data. Each slice
 * carries its own colour rather than being assigned one by position — the
 * chart always shows the same six categories in the same order, so the
 * mapping is explicit at the call site (see CHART_CATEGORY_COLOR).
 */
export function Donut({
  slices,
  size = 156,
}: {
  slices: { key: string; percent: number; color: string }[];
  size?: number;
}) {
  const stroke = size * 0.21; // (1 - 0.58) / 2 of the diameter
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  const total = slices.reduce((sum, s) => sum + s.percent, 0);
  const visible = slices.filter((s) => s.percent > 0);

  if (total <= 0) {
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-track)"
          strokeWidth={stroke}
        />
      </svg>
    );
  }

  // Offsets are precomputed rather than accumulated during render — mutating
  // a closure variable while mapping breaks under the React Compiler.
  const segments = visible.map((slice, index) => {
    const preceding = visible
      .slice(0, index)
      .reduce((sum, s) => sum + (s.percent / total) * circumference, 0);
    const length = (slice.percent / total) * circumference;
    return { ...slice, length, offset: preceding };
  });

  // Thin visual gap between neighbours, as in the Figma arcs.
  const gap = visible.length > 1 ? 2 : 0;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label="Spending by category"
      className="shrink-0"
    >
      <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
        {segments.map((slice) => (
          <circle
            key={slice.key}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={slice.color}
            strokeWidth={stroke}
            strokeDasharray={`${Math.max(0, slice.length - gap)} ${
              circumference - Math.max(0, slice.length - gap)
            }`}
            strokeDashoffset={-slice.offset}
          />
        ))}
      </g>
    </svg>
  );
}

/** Legend row: colour dot, label, percentage. Figma: 13px Medium. */
export function DonutLegend({
  items,
}: {
  items: { key: string; label: string; percent: number; color: string }[];
}) {
  return (
    <ul className="flex min-w-0 flex-1 flex-col gap-3">
      {items.map((item) => (
        <li key={item.key} className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="size-3 shrink-0 rounded-full"
            style={{ background: item.color }}
          />
          <span className="min-w-0 flex-1 truncate text-cat font-medium text-ink-3">
            {item.label}
          </span>
          <span className="tnum shrink-0 text-cat font-medium text-ink-4">
            {Math.round(item.percent)}%
          </span>
        </li>
      ))}
    </ul>
  );
}
