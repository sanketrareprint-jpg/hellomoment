type BarDatum = { label: string; value: number };

const INK_SECONDARY = '#52514e';
const INK_MUTED = '#898781';
const BASELINE = '#c3c2b7';

function roundedTopRectPath(x: number, y: number, width: number, height: number, radius: number) {
  const r = Math.min(radius, width / 2, Math.max(height, 0));
  if (height <= 0) return '';
  if (r <= 0) {
    return `M${x},${y + height} L${x},${y} L${x + width},${y} L${x + width},${y + height} Z`;
  }
  return [
    `M${x},${y + height}`,
    `L${x},${y + r}`,
    `Q${x},${y} ${x + r},${y}`,
    `L${x + width - r},${y}`,
    `Q${x + width},${y} ${x + width},${y + r}`,
    `L${x + width},${y + height}`,
    `Z`,
  ].join(' ');
}

export default function AdminBarChart({
  data,
  color = '#db2777',
  formatValue = (v: number) => v.toLocaleString('en-IN'),
  height = 160,
}: {
  data: BarDatum[];
  color?: string;
  formatValue?: (v: number) => string;
  height?: number;
}) {
  const barSlot = 52;
  const barWidth = 22;
  const paddingTop = 22; // room for value labels
  const paddingBottom = 20; // room for x-axis labels
  const plotHeight = height;
  const width = Math.max(data.length * barSlot, barSlot);
  const svgHeight = plotHeight + paddingTop + paddingBottom;
  const max = Math.max(1, ...data.map((d) => d.value));
  const hasData = data.some((d) => d.value > 0);

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${svgHeight}`}
        width={width}
        height={svgHeight}
        className="block"
        role="img"
        aria-label="Bar chart"
      >
        <line
          x1={0}
          y1={paddingTop + plotHeight}
          x2={width}
          y2={paddingTop + plotHeight}
          stroke={BASELINE}
          strokeWidth={1}
        />
        {!hasData && (
          <text x={width / 2} y={paddingTop + plotHeight / 2} textAnchor="middle" fontSize={11} fill={INK_MUTED}>
            No data yet
          </text>
        )}
        {data.map((d, i) => {
          const barHeight = hasData ? (d.value / max) * (plotHeight - 6) : 0;
          const x = i * barSlot + (barSlot - barWidth) / 2;
          const y = paddingTop + plotHeight - barHeight;
          return (
            <g key={d.label + i}>
              <title>
                {d.label}: {formatValue(d.value)}
              </title>
              {barHeight > 0 && <path d={roundedTopRectPath(x, y, barWidth, barHeight, 4)} fill={color} />}
              <text
                x={x + barWidth / 2}
                y={y - 6}
                textAnchor="middle"
                fontSize={10.5}
                fontWeight={600}
                fill={INK_SECONDARY}
              >
                {d.value > 0 ? formatValue(d.value) : ''}
              </text>
              <text
                x={x + barWidth / 2}
                y={paddingTop + plotHeight + 14}
                textAnchor="middle"
                fontSize={10.5}
                fill={INK_MUTED}
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
