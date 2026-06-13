import { useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { useTheme } from '@/features/settings/ThemeContext';
import type { Measurement } from '@/shared/db/types';

interface TrendChartProps {
  measurements: Measurement[];
  metricKey: string;
  label: string;
  unit: string;
  height?: number;
  color?: string;
}

function extractValue(m: Measurement, key: string): number | null {
  const raw     = m.raw     as unknown as Record<string, unknown>;
  const derived = m.derived as unknown as Record<string, unknown>;
  const v = raw[key] ?? derived[key];
  return typeof v === 'number' ? v : null;
}

interface TooltipPayloadItem {
  value: number;
  payload: { unit?: string; date: string };
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const v = payload[0].value;
  const unit = payload[0].payload.unit ?? '';
  return (
    <div
      className="rounded-xl px-3 py-2 text-center"
      style={{
        background:           'var(--surface-strong)',
        border:               '1px solid var(--glass-border)',
        backdropFilter:       'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow:            'var(--glass-shadow)',
        minWidth:             80,
        color:                'var(--ink)',
      }}
    >
      <div className="text-sm font-bold leading-tight">{v.toFixed(1)} {unit}</div>
      <div className="text-[10px] mt-0.5" style={{ color: 'var(--ink-3)' }}>{label}</div>
    </div>
  );
}

export function TrendChart({ measurements, metricKey, label, unit, height = 160, color }: TrendChartProps) {
  const { resolved } = useTheme();

  const data = useMemo(() => (
    [...measurements]
      .reverse()
      .map((m) => ({
        date:  new Date(m.timestamp).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
        value: extractValue(m, metricKey),
        unit,
      }))
      .filter((d): d is { date: string; value: number; unit: string } => d.value !== null)
  ), [measurements, metricKey, unit]);

  const lineColor = color
    ?? (resolved === 'dark' ? '#A3E635' : '#5C8A28');
  const gridColor  = resolved === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(17,20,26,0.06)';
  const axisColor  = resolved === 'dark' ? 'rgba(241,245,249,0.4)' : '#9CA3AF';

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center text-sm" style={{ height, color: 'var(--ink-3)' }}>
        Not enough data
      </div>
    );
  }

  const gradId = `grad-${metricKey}-${resolved}`;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 16, right: 8, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={lineColor} stopOpacity={0.22} />
            <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={gridColor} strokeDasharray="3 4" vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 10, fill: axisColor }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 10, fill: axisColor }} axisLine={false} tickLine={false} width={40} />
        <Tooltip
          content={<CustomTooltip />}
          cursor={{ stroke: lineColor, strokeDasharray: '3 3', strokeWidth: 1.5 }}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={lineColor}
          strokeWidth={2.5}
          fill={`url(#${gradId})`}
          activeDot={{ fill: lineColor, stroke: resolved === 'dark' ? '#0B0E13' : '#FFFFFF', strokeWidth: 3, r: 6 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
