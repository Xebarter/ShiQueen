'use client';

import { useEffect, useState } from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  formatPercentChange,
  trendFromChange,
  type StatusFunnelItem,
} from '@/lib/analytics/compute';
import { formatUGX } from '@/lib/wholesale-data';
import { cn } from '@/lib/utils';

export const CHART_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
];

function useChartReady() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
  }, []);
  return ready;
}

function ChartFrame({
  height,
  children,
}: {
  height: number;
  children: React.ReactNode;
}) {
  const ready = useChartReady();
  if (!ready) {
    return (
      <div
        className="animate-pulse rounded-lg bg-muted/30"
        style={{ width: '100%', height }}
        aria-hidden
      />
    );
  }
  return <div style={{ width: '100%', height }}>{children}</div>;
}

export function AnalyticsMetricCard({
  title,
  value,
  change,
  hint,
  className,
}: {
  title: string;
  value: string;
  change?: number;
  hint?: string;
  className?: string;
}) {
  const trend = change !== undefined ? trendFromChange(change) : 'flat';
  const TrendIcon = trend === 'down' ? TrendingDown : TrendingUp;

  return (
    <div
      className={cn(
        'rounded-xl border border-border/70 bg-card p-4 shadow-sm shadow-primary/5',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</p>
        {change !== undefined && (
          <TrendIcon
            className={cn(
              'h-4 w-4 shrink-0',
              trend === 'up' && 'text-emerald-600',
              trend === 'down' && 'text-red-600',
              trend === 'flat' && 'text-muted-foreground'
            )}
          />
        )}
      </div>
      <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
      {change !== undefined && (
        <p
          className={cn(
            'mt-1 text-xs',
            trend === 'up' && 'text-emerald-600',
            trend === 'down' && 'text-red-600',
            trend === 'flat' && 'text-muted-foreground'
          )}
        >
          {formatPercentChange(change)} vs prior period
        </p>
      )}
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function AnalyticsChartCard({
  title,
  description,
  children,
  className,
  action,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}) {
  return (
    <Card className={cn('overflow-hidden border-border/70 shadow-sm', className)}>
      <CardHeader className="border-b border-border/60 bg-muted/10">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg font-light tracking-tight">{title}</CardTitle>
            {description && <CardDescription className="mt-1">{description}</CardDescription>}
          </div>
          {action}
        </div>
      </CardHeader>
      <CardContent className="pt-5">{children}</CardContent>
    </Card>
  );
}

function ChartTooltip({
  active,
  payload,
  label,
  valueFormatter = (v: number) => String(v),
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; color?: string }>;
  label?: string;
  valueFormatter?: (value: number) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-md">
      {label && <p className="mb-1 font-medium">{label}</p>}
      {payload.map((entry) => (
        <p key={entry.name} className="tabular-nums text-muted-foreground">
          <span style={{ color: entry.color }}>{entry.name}: </span>
          {valueFormatter(Number(entry.value ?? 0))}
        </p>
      ))}
    </div>
  );
}

export function RevenueTrendChart({
  data,
  revenueKey = 'revenue',
  secondaryKey,
  secondaryLabel = 'Orders',
  height = 260,
}: {
  data: Array<Record<string, string | number>>;
  revenueKey?: string;
  secondaryKey?: string;
  secondaryLabel?: string;
  height?: number;
}) {
  if (data.length === 0) {
    return <EmptyChart message="Trend data will appear once activity starts." />;
  }

  return (
    <ChartFrame height={height}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            yAxisId="left"
            tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
            axisLine={false}
            tickLine={false}
            width={56}
            tickFormatter={(v) => compactUGX(Number(v))}
          />
          {secondaryKey && (
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
              axisLine={false}
              tickLine={false}
              width={36}
            />
          )}
          <Tooltip
            content={
              <ChartTooltip
                valueFormatter={(v) =>
                  // Heuristic: large values are money
                  v >= 1000 ? formatUGX(v) : String(v)
                }
              />
            }
          />
          <Area
            yAxisId="left"
            type="monotone"
            dataKey={revenueKey}
            name="Revenue"
            stroke="var(--chart-1)"
            fill="url(#revenueFill)"
            strokeWidth={2}
          />
          {secondaryKey && (
            <Area
              yAxisId="right"
              type="monotone"
              dataKey={secondaryKey}
              name={secondaryLabel}
              stroke="var(--chart-2)"
              fill="transparent"
              strokeWidth={2}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

export function SimpleBarChart({
  data,
  dataKey,
  nameKey = 'label',
  color = 'var(--chart-1)',
  valueFormatter = (v: number) => String(v),
  height = 240,
  horizontal = false,
}: {
  data: Array<Record<string, string | number>>;
  dataKey: string;
  nameKey?: string;
  color?: string;
  valueFormatter?: (value: number) => string;
  height?: number;
  horizontal?: boolean;
}) {
  if (data.length === 0) {
    return <EmptyChart message="No data for this chart yet." />;
  }

  return (
    <ChartFrame height={height}>
      <ResponsiveContainer>
        <BarChart
          data={data}
          layout={horizontal ? 'vertical' : 'horizontal'}
          margin={{ top: 8, right: 8, left: horizontal ? 8 : 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={!horizontal} vertical={horizontal} />
          {horizontal ? (
            <>
              <XAxis
                type="number"
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => compactUGX(Number(v))}
              />
              <YAxis
                type="category"
                dataKey={nameKey}
                width={96}
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                axisLine={false}
                tickLine={false}
              />
            </>
          ) : (
            <>
              <XAxis
                dataKey={nameKey}
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                axisLine={false}
                tickLine={false}
                width={48}
                tickFormatter={(v) =>
                  Number(v) >= 1000 ? compactUGX(Number(v)) : String(v)
                }
              />
            </>
          )}
          <Tooltip content={<ChartTooltip valueFormatter={valueFormatter} />} />
          <Bar dataKey={dataKey} name={dataKey} fill={color} radius={[6, 6, 0, 0]} maxBarSize={48} />
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

export function SharePieChart({
  data,
  height = 240,
}: {
  data: Array<{ name: string; value: number }>;
  height?: number;
}) {
  if (data.length === 0 || data.every((d) => d.value === 0)) {
    return <EmptyChart message="No breakdown data yet." />;
  }

  return (
    <ChartFrame height={height}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={2}
            stroke="var(--card)"
            strokeWidth={2}
          >
            {data.map((_, index) => (
              <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltip />} />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

export function StatusFunnelBars({ items }: { items: StatusFunnelItem[] }) {
  if (items.length === 0) {
    return <EmptyChart message="No status data yet." />;
  }
  const max = Math.max(...items.map((i) => i.count), 1);

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={item.status}>
          <div className="mb-1.5 flex items-center justify-between gap-2 text-xs">
            <span className="font-medium capitalize">{item.label}</span>
            <span className="tabular-nums text-muted-foreground">
              {item.count} · {item.percentage}%
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted">
            <div
              className="h-2 rounded-full transition-all"
              style={{
                width: `${(item.count / max) * 100}%`,
                background: CHART_COLORS[index % CHART_COLORS.length],
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function RankedList({
  items,
  emptyMessage = 'Nothing to show yet.',
}: {
  items: Array<{
    id: string;
    title: string;
    subtitle?: string;
    value: string;
    meta?: string;
  }>;
  emptyMessage?: string;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div
          key={item.id}
          className="flex items-start justify-between gap-3 border-b border-border/60 pb-3 last:border-0 last:pb-0"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">
              <span className="mr-1.5 text-muted-foreground">{index + 1}.</span>
              {item.title}
            </p>
            {item.subtitle && (
              <p className="mt-0.5 text-xs text-muted-foreground">{item.subtitle}</p>
            )}
          </div>
          <div className="shrink-0 text-right">
            <p className="text-sm font-semibold tabular-nums">{item.value}</p>
            {item.meta && <p className="text-xs text-muted-foreground">{item.meta}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-border/70 bg-muted/20 px-4 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}

function compactUGX(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}k`;
  return String(Math.round(value));
}
