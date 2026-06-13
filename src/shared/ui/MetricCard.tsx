import { GlassCard, type CardVariant } from './GlassCard';
import { StatusBadge } from './StatusBadge';
import type { MetricStatus } from '@/features/metrics/classify';

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  status?: MetricStatus;
  referenceLabel?: string;
  onClick?: () => void;
  variant?: CardVariant;
  icon?: React.ReactNode;
}

export function MetricCard({
  label,
  value,
  unit,
  status,
  referenceLabel,
  onClick,
  variant = 'glass',
  icon,
}: MetricCardProps) {
  return (
    <GlassCard onClick={onClick} variant={variant} className="flex flex-col gap-1 min-h-[112px]">
      <div className="flex items-start justify-between gap-2">
        <span className="text-[11px] font-medium uppercase tracking-[0.06em]" style={{ color: 'var(--ink-3)' }}>
          {label}
        </span>
        {icon && (
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--surface-strong)', color: 'var(--ink)' }}
          >
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-1 mt-auto">
        <span className="text-[28px] font-semibold tabular-nums leading-none" style={{ color: 'var(--ink)' }}>
          {value}
        </span>
        {unit && <span className="text-sm" style={{ color: 'var(--ink-2)' }}>{unit}</span>}
      </div>

      {status && <StatusBadge status={status} className="self-start mt-1" />}
      {!status && referenceLabel && (
        <span className="text-[10px]" style={{ color: 'var(--ink-3)' }}>{referenceLabel}</span>
      )}
    </GlassCard>
  );
}
