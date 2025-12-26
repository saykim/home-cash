import { useMemo } from 'react';
import { format, eachDayOfInterval, startOfMonth, endOfMonth } from 'date-fns';
import { formatCurrency } from '@/lib/formatters';
import type { Transaction } from '@/types';

interface CumulativeChartProps {
  transactions: Transaction[];
  currentMonth: Date;
}

export function CumulativeChart({ transactions, currentMonth }: CumulativeChartProps) {
  const chartData = useMemo(() => {
    const days = eachDayOfInterval({
      start: startOfMonth(currentMonth),
      end: endOfMonth(currentMonth)
    });

    let cumulative = 0;
    const data = days.map((date) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayExpenses = transactions
        .filter((t) => t.date === dateStr && t.type === 'EXPENSE')
        .reduce((sum, t) => sum + t.amount, 0);

      cumulative += dayExpenses;

      return {
        date: dateStr,
        day: date.getDate(),
        cumulative,
        dailyExpense: dayExpenses
      };
    });

    return data;
  }, [transactions, currentMonth]);

  const maxCumulative = Math.max(...chartData.map(d => d.cumulative), 0);
  const width = 800;
  const height = 80;
  const padding = { top: 10, right: 10, bottom: 20, left: 40 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Generate SVG path
  const points = chartData.map((d, i) => {
    const x = padding.left + (i / (chartData.length - 1)) * chartWidth;
    const y = padding.top + chartHeight - (d.cumulative / maxCumulative) * chartHeight;
    return { x, y, data: d };
  });

  const pathD = points.map((p, i) => {
    return `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`;
  }).join(' ');

  // Area fill path
  const areaPathD = pathD + ` L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${padding.left} ${padding.top + chartHeight} Z`;

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[800px]">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold">월간 누적 지출</h3>
          <p className="text-xs text-muted-foreground">
            총 지출: <span className="font-bold text-red-600">{formatCurrency(maxCumulative)}</span>
          </p>
        </div>

        <svg width={width} height={height} className="w-full" viewBox={`0 0 ${width} ${height}`}>
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = padding.top + chartHeight * (1 - ratio);
            return (
              <g key={ratio}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="currentColor"
                  strokeOpacity={0.1}
                  strokeDasharray="2,2"
                />
                <text
                  x={padding.left - 5}
                  y={y}
                  textAnchor="end"
                  dominantBaseline="middle"
                  className="text-[8px] fill-muted-foreground"
                >
                  {(maxCumulative * ratio / 10000).toFixed(0)}만
                </text>
              </g>
            );
          })}

          {/* Area fill */}
          <path
            d={areaPathD}
            fill="currentColor"
            className="text-red-500/10"
          />

          {/* Line */}
          <path
            d={pathD}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="text-red-600"
          />

          {/* Points */}
          {points.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={2}
              fill="currentColor"
              className="text-red-600"
            >
              <title>
                {p.data.day}일: {formatCurrency(p.data.cumulative)} (일일: {formatCurrency(p.data.dailyExpense)})
              </title>
            </circle>
          ))}

          {/* X-axis labels (every 5 days) */}
          {points.filter((_, i) => i % 5 === 0 || i === points.length - 1).map((p, i) => (
            <text
              key={i}
              x={p.x}
              y={height - 5}
              textAnchor="middle"
              className="text-[8px] fill-muted-foreground"
            >
              {p.data.day}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
}
