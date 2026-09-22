type DonutDatum = { label: string; value: number; color: string };

const INK_PRIMARY = '#0b0b0b';

export default function AdminDonutChart({
  data,
  centerLabel,
  size = 132,
}: {
  data: DonutDatum[];
  centerLabel?: string;
  size?: number;
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const radius = 40;
  const strokeWidth = 16;
  const gap = total > 0 ? 1.5 : 0; // percent of circumference left blank between segments

  let cumulative = 0;
  const segments = data
    .filter((d) => d.value > 0)
    .map((d) => {
      const percent = total > 0 ? (d.value / total) * 100 : 0;
      const dash = Math.max(percent - gap, 0);
      const seg = { ...d, percent, dash, offset: -cumulative };
      cumulative += percent;
      return seg;
    });

  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 100 100" width={size} height={size} className="shrink-0" role="img" aria-label="Donut chart">
        <circle cx={50} cy={50} r={radius} fill="none" stroke="#f2f1ee" strokeWidth={strokeWidth} />
        {total === 0 ? null : (
          <g transform="rotate(-90 50 50)">
            {segments.map((s, i) => (
              <circle
                key={s.label + i}
                cx={50}
                cy={50}
                r={radius}
                fill="none"
                stroke={s.color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                pathLength={100}
                strokeDasharray={`${s.dash} ${100 - s.dash}`}
                strokeDashoffset={s.offset}
              >
                <title>
                  {s.label}: {s.value.toLocaleString('en-IN')} ({s.percent.toFixed(0)}%)
                </title>
              </circle>
            ))}
          </g>
        )}
        {centerLabel && (
          <text x={50} y={53} textAnchor="middle" fontSize={13} fontWeight={700} fill={INK_PRIMARY}>
            {centerLabel}
          </text>
        )}
      </svg>
      <ul className="space-y-1 text-xs min-w-0">
        {data.map((d, i) => {
          const percent = total > 0 ? (d.value / total) * 100 : 0;
          return (
            <li key={d.label + i} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
              <span className="text-gray-700 font-medium truncate">{d.label}</span>
              <span className="text-gray-400 shrink-0">
                {d.value.toLocaleString('en-IN')} · {percent.toFixed(0)}%
              </span>
            </li>
          );
        })}
        {total === 0 && <li className="text-gray-400">No data yet</li>}
      </ul>
    </div>
  );
}
