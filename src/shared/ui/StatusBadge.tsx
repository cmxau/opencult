import type { MetricStatus } from '@/features/metrics/classify';

const LABEL: Record<MetricStatus, string> = {
  optimal: 'Optimal',
  normal:  'Normal',
  low:     'Low',
  high:    'High',
  alert:   'Alert',
  unknown: '—',
};

const COLOR_VAR: Record<MetricStatus, string> = {
  optimal: 'var(--status-ok)',
  normal:  'var(--status-ok)',
  low:     'var(--status-low)',
  high:    'var(--status-warn)',
  alert:   'var(--status-alert)',
  unknown: 'var(--ink-3)',
};

interface StatusBadgeProps {
  status: MetricStatus;
  className?: string;
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const color = COLOR_VAR[status];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-pill px-2 py-0.5 text-[10px] font-medium ${className}`}
      style={{ color, background: `color-mix(in srgb, ${color} 14%, transparent)` }}
    >
      <span
        aria-hidden
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: color }}
      />
      {LABEL[status]}
    </span>
  );
}
