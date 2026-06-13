import { useState, useEffect, useMemo } from 'react';
import { useNavigate }                  from 'react-router-dom';
import { useUsers }                     from '@/features/users/UserContext';
import { useSettings }                  from '@/features/settings/SettingsContext';
import { useTheme }                     from '@/features/settings/ThemeContext';
import { getMeasurementsForUser }       from '@/features/history/historyService';
import { GlassCard, type CardVariant }  from '@/shared/ui/GlassCard';
import { TrendChart }                   from '@/shared/ui/TrendChart';
import { ProfileSwitcher }              from '@/shared/ui/ProfileSwitcher';
import { BrandMark }                    from '@/shared/ui/BrandMark';
import { StatusBadge }                  from '@/shared/ui/StatusBadge';
import {
  ChartLineIcon, BodyIcon, SunIcon, MoonIcon,
} from '@/shared/ui/Icons';
import {
  classifyFatRatio, classifyWaterRatio, classifyFFMI,
  type MetricStatus,
} from '@/features/metrics/classify';
import { trendFor } from '@/features/metrics/trends';
import { formatWeightValue, weightUnitLabel } from '@/shared/units';
import type { Measurement, RawMeasurement, DerivedMetrics, AppSettings } from '@/shared/db/types';
import type { Sex } from '@/shared/db/types';

// ─── Category card config ─────────────────────────────────────────────────────

interface CategoryCardDef {
  label: string;
  getValue: (raw: RawMeasurement, derived: DerivedMetrics, settings: AppSettings) => string;
  getUnit: (raw: RawMeasurement, derived: DerivedMetrics, settings: AppSettings) => string;
  getStatus?: (raw: RawMeasurement, derived: DerivedMetrics, sex: Sex) => MetricStatus;
  historyMetric: string;
  advanced?: true;
}

const TINTS: Array<'tintA' | 'tintB' | 'tintC'> = ['tintA', 'tintB', 'tintC'];

const CATEGORY_CARDS: CategoryCardDef[] = [
  {
    label:    'Measurements',
    getValue: (raw, _, s)  => formatWeightValue(raw.weightKg, s.weightUnit),
    getUnit:  (_r, _d, s)  => weightUnitLabel(s.weightUnit),
    historyMetric: 'weightKg',
  },
  {
    label:     'Fat',
    getValue:  (raw)        => raw.fatRatioPct.toFixed(1),
    getUnit:   ()           => '%',
    getStatus: (raw, _, sex) => classifyFatRatio(raw.fatRatioPct, sex).status,
    historyMetric: 'fatRatioPct',
  },
  {
    label:    'Muscle',
    getValue: (raw, _, s)  => formatWeightValue(raw.muscleMassKg, s.weightUnit),
    getUnit:  (_r, _d, s)  => weightUnitLabel(s.weightUnit),
    historyMetric: 'muscleMassKg',
  },
  {
    label:    'Lean tissue',
    getValue: (raw, _, s)  => formatWeightValue(raw.leanBodyMassKg, s.weightUnit),
    getUnit:  (_r, _d, s)  => weightUnitLabel(s.weightUnit),
    historyMetric: 'leanBodyMassKg',
  },
  {
    label:     'Water',
    getValue:  (raw)        => raw.waterRatioPct.toFixed(1),
    getUnit:   ()           => '%',
    getStatus: (raw, _, sex) => classifyWaterRatio(raw.waterRatioPct, sex).status,
    historyMetric: 'waterRatioPct',
  },
  {
    label:    'Bone & minerals',
    getValue: (raw, _, s)  => formatWeightValue(raw.boneMassKg, s.weightUnit),
    getUnit:  (_r, _d, s)  => weightUnitLabel(s.weightUnit),
    historyMetric: 'boneMassKg',
  },
  {
    label:    'Protein',
    getValue: (raw)        => raw.proteinRatioPct.toFixed(1),
    getUnit:  ()           => '%',
    historyMetric: 'proteinRatioPct',
  },
  {
    label:    'Metabolism',
    getValue: (raw)        => String(raw.bmrKcal),
    getUnit:  ()           => 'kcal',
    historyMetric: 'bmrKcal',
  },
  {
    label:    'Health',
    getValue: (raw)        => String(raw.healthScore),
    getUnit:  ()           => '/100',
    historyMetric: 'healthScore',
  },
  {
    label:    'Goals',
    getValue: (_, d)       => d.estimatedDaysToGoal >= 0 ? String(d.estimatedDaysToGoal) : '—',
    getUnit:  (_, d)       => d.estimatedDaysToGoal >= 0 ? 'd' : '',
    historyMetric: 'estimatedDaysToGoal',
  },
  {
    label:     'Advanced',
    getValue:  (_, d)       => d.ffmi.toFixed(1),
    getUnit:   ()           => '',
    getStatus: (_, d, sex)  => classifyFFMI(d.ffmi, sex).status,
    historyMetric: 'ffmi',
    advanced: true,
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const navigate              = useNavigate();
  const { activeUser }        = useUsers();
  const { settings }          = useSettings();
  const { mode, resolved, setMode } = useTheme();
  const [history, setHistory] = useState<Measurement[]>([]);

  useEffect(() => {
    if (activeUser?.id) getMeasurementsForUser(activeUser.id).then(setHistory);
    else setHistory([]);
  }, [activeUser]);

  const latest  = history[0] ?? null;
  const raw     = latest?.raw;
  const derived = latest?.derived;
  const sex     = activeUser?.sex ?? 'male';

  const firstName   = useMemo(() => activeUser?.name.split(' ')[0] ?? '', [activeUser]);
  const weightTrend = useMemo(() => trendFor(history.slice(0, 14), 'weightKg'), [history]);

  function cycleTheme() {
    setMode(mode === 'dark' ? 'light' : 'dark');
  }

  const visibleCards = CATEGORY_CARDS.filter(
    c => !c.advanced || settings.showAdvancedMetrics,
  );

  return (
    <div className="flex flex-col gap-6 px-5 pt-12 pb-32">

      {/* Header */}
      <header className="flex items-center justify-between gap-3">
        <BrandMark />
        <div className="flex items-center gap-2">
          <button
            onClick={cycleTheme}
            aria-label={`Switch theme (currently ${mode})`}
            className="w-11 h-11 rounded-full flex items-center justify-center transition-transform active:scale-95"
            style={{
              background:           'var(--surface)',
              backdropFilter:       'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border:               '1px solid var(--glass-border)',
              color:                'var(--ink)',
            }}
          >
            {resolved === 'dark' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
          </button>
          <ProfileSwitcher
            onAddProfile={() => navigate('/settings?action=add-profile')}
            onEditProfile={() => navigate('/settings?action=edit-profile')}
          />
        </div>
      </header>

      {/* Greeting */}
      <div>
        {activeUser ? (
          <>
            <p className="text-sm" style={{ color: 'var(--ink-2)' }}>Hi {firstName}!</p>
            <h1 className="text-[34px] leading-[1.1] font-bold tracking-tight" style={{ color: 'var(--ink)' }}>
              How do you<br />feel today?
            </h1>
          </>
        ) : (
          <>
            <p className="text-sm" style={{ color: 'var(--ink-2)' }}>Welcome</p>
            <h1 className="text-[32px] leading-[1.1] font-bold tracking-tight" style={{ color: 'var(--ink)' }}>
              Set up a profile<br />to get started
            </h1>
          </>
        )}
      </div>

      {/* Empty state */}
      {!latest && (
        <GlassCard className="flex flex-col items-center text-center py-8">
          <BodyIcon className="w-10 h-10 mb-3" style={{ color: 'var(--ink-3)' }} />
          <p className="text-base font-medium" style={{ color: 'var(--ink)' }}>
            {activeUser ? 'No measurements yet' : 'No active profile'}
          </p>
          <p className="text-sm mt-1" style={{ color: 'var(--ink-2)' }}>
            {activeUser
              ? 'Step on your scale and open Measure.'
              : 'Create a profile in Settings to start tracking.'}
          </p>
          {activeUser && (
            <button
              onClick={() => navigate('/measure')}
              className="mt-4 px-5 py-2.5 rounded-pill text-sm font-semibold"
              style={{ background: 'var(--accent)', color: 'var(--accent-on)' }}
            >
              Start measuring
            </button>
          )}
        </GlassCard>
      )}

      {/* Hero card */}
      {raw && latest && (
        <GlassCard className="p-5">
          <p className="text-sm text-center" style={{ color: 'var(--ink-2)' }}>
            Here&apos;s how your body is today
          </p>
          <div className="flex items-start justify-between mt-3 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--surface-strong)' }}>
              <ChartLineIcon className="w-5 h-5" style={{ color: 'var(--ink)' }} />
            </div>
            <div className="text-right">
              <span className="text-3xl font-bold" style={{ color: 'var(--ink)' }}>{raw.healthScore}</span>
              <span className="text-sm ml-1" style={{ color: 'var(--ink-2)' }}>health</span>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--ink-3)' }}>
                {raw.healthEvaluation}
              </p>
            </div>
          </div>
          <TrendChart
            measurements={history.slice(0, 14)}
            metricKey="weightKg"
            label="Weight"
            unit={weightUnitLabel(settings.weightUnit)}
            height={140}
          />
          <div className="flex items-center justify-between mt-3 pt-3 border-t" style={{ borderColor: 'var(--glass-border)' }}>
            <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--ink-3)' }}>
              <ChartLineIcon className="w-4 h-4" />
              <span>
                {weightTrend.changePct !== null && Math.abs(weightTrend.changePct) > 0.1
                  ? `${weightTrend.direction === 'up' ? '↑' : '↓'} ${Math.abs(weightTrend.changePct).toFixed(1)}% · ${history.length} readings`
                  : `${history.length} readings`}
              </span>
            </div>
            <button
              onClick={() => navigate('/history')}
              className="text-xs font-semibold underline underline-offset-2"
              style={{ color: 'var(--ink)' }}
            >
              View trends ›
            </button>
          </div>
        </GlassCard>
      )}

      {/* Category grid */}
      {raw && derived && (
        <section className="grid grid-cols-2 gap-3">
          {visibleCards.map((card, i) => {
            const tint = TINTS[i % TINTS.length];
            return (
              <CategorySummaryCard
                key={card.label}
                label={card.label}
                value={card.getValue(raw, derived, settings)}
                unit={card.getUnit(raw, derived, settings)}
                status={card.getStatus?.(raw, derived, sex)}
                tint={tint}
                onClick={() => navigate(`/history?metric=${card.historyMetric}`)}
              />
            );
          })}
        </section>
      )}

      {latest?.timestamp && (
        <p className="text-xs text-center" style={{ color: 'var(--ink-3)' }}>
          Last measured · {formatWeightValue(latest.raw.weightKg, settings.weightUnit)} {weightUnitLabel(settings.weightUnit)} · {new Date(latest.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
      )}
    </div>
  );
}

// ─── CategorySummaryCard ──────────────────────────────────────────────────────

function CategorySummaryCard({
  label, value, unit, status, tint, onClick,
}: {
  label: string;
  value: string;
  unit: string;
  status?: MetricStatus;
  tint: CardVariant;
  onClick: () => void;
}) {
  return (
    <GlassCard variant={tint} onClick={onClick} className="min-h-[112px]">
      <div className="flex flex-col gap-1">
        <span
          className="text-[10px] font-semibold uppercase tracking-[0.06em]"
          style={{ color: 'var(--ink-3)' }}
        >
          {label}
        </span>
        <div className="flex items-baseline gap-1 mt-4">
          <span
            className="text-[26px] font-bold tabular-nums leading-none"
            style={{ color: 'var(--ink)' }}
          >
            {value}
          </span>
          {unit && (
            <span className="text-xs" style={{ color: 'var(--ink-2)' }}>{unit}</span>
          )}
        </div>
        {status && <StatusBadge status={status} className="self-start mt-1" />}
      </div>
    </GlassCard>
  );
}
