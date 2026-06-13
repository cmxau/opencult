import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useUsers }    from '@/features/users/UserContext';
import { useSettings } from '@/features/settings/SettingsContext';
import { getMeasurementsForUser, deleteMeasurement } from '@/features/history/historyService';
import { GlassCard }  from '@/shared/ui/GlassCard';
import { TrendChart } from '@/shared/ui/TrendChart';
import {
  ChartLineIcon, ArrowUpIcon, ArrowDownIcon, PulseIcon, CloseIcon, CheckIcon,
} from '@/shared/ui/Icons';
import {
  cardVariants, staggerContainer, sheetVariants, backdropVariants, fadeVariants,
} from '@/shared/motion';
import {
  METRIC_DEFS, GROUP_LABELS, GROUP_ORDER,
  type MetricGroupKey, type MetricDef,
} from '@/features/metrics';
import { trendFor }   from '@/features/metrics/trends';
import { formatWeight, formatWeightValue, weightUnitLabel } from '@/shared/units';
import type { Measurement } from '@/shared/db/types';
import type { AppSettings } from '@/shared/db/types';

type Range = '1W' | '1M' | '3M' | 'All';

const RANGE_DAYS: Record<Range, number | null> = {
  '1W': 7, '1M': 30, '3M': 90, 'All': null,
};

const WEIGHT_KEYS = new Set(['weightKg', 'standardWeightKg', 'fatMassKg', 'muscleMassKg', 'leanBodyMassKg']);

export default function HistoryPage() {
  const [params]          = useSearchParams();
  const { activeUser }    = useUsers();
  const { settings }      = useSettings();
  const [all, setAll]     = useState<Measurement[]>([]);
  const [range, setRange] = useState<Range>('1M');
  const [metricKey, setMetricKey] = useState<string>(params.get('metric') ?? 'weightKg');
  const [pickerOpen, setPickerOpen]   = useState(false);
  const [pickerGroup, setPickerGroup] = useState<MetricGroupKey | 'all'>('all');

  useEffect(() => {
    if (activeUser?.id) getMeasurementsForUser(activeUser.id).then(setAll);
    else setAll([]);
  }, [activeUser]);

  const filtered = useMemo(() => {
    const days = RANGE_DAYS[range];
    if (days === null) return all;
    const from = new Date(Date.now() - days * 86_400_000);
    return all.filter(m => new Date(m.timestamp) >= from);
  }, [all, range]);

  const selectedMetric: MetricDef = useMemo(
    () => METRIC_DEFS.find(m => m.key === metricKey) ?? METRIC_DEFS[0],
    [metricKey],
  );

  const pickerMetrics = useMemo(() =>
    pickerGroup === 'all' ? METRIC_DEFS : METRIC_DEFS.filter(m => m.group === pickerGroup),
    [pickerGroup],
  );

  const trend = useMemo(
    () => trendFor(filtered, selectedMetric.key),
    [filtered, selectedMetric],
  );

  // Group filtered measurements by "Month Year"
  const grouped = useMemo(() => {
    const map = new Map<string, Measurement[]>();
    for (const m of filtered) {
      const key = new Date(m.timestamp).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    }
    return Array.from(map.entries()).map(([label, items]) => ({ label, items }));
  }, [filtered]);

  async function handleDelete(id: number) {
    if (!confirm('Delete this measurement?')) return;
    await deleteMeasurement(id);
    setAll(prev => prev.filter(m => m.id !== id));
  }

  function valueDisplay(v: number | null): string {
    if (v === null) return '—';
    if (WEIGHT_KEYS.has(selectedMetric.key)) return formatWeightValue(v, settings.weightUnit);
    return v.toFixed(1);
  }
  function unitDisplay(): string {
    if (WEIGHT_KEYS.has(selectedMetric.key)) return weightUnitLabel(settings.weightUnit);
    return selectedMetric.unit;
  }

  return (
    <>
      <div className="flex flex-col gap-5 px-5 pt-12 pb-32">

        {/* ── Header ── */}
        <div>
          <p className="text-sm" style={{ color: 'var(--ink-2)' }}>Trends</p>
          <h1 className="text-3xl font-bold leading-tight" style={{ color: 'var(--ink)' }}>Your history</h1>
        </div>

        {/* ── Range pills ── */}
        <div className="flex gap-2">
          {(['1W', '1M', '3M', 'All'] as Range[]).map(r => {
            const active = range === r;
            return (
              <button
                key={r}
                onClick={() => setRange(r)}
                className="flex-1 py-2 rounded-pill text-xs font-semibold transition-colors"
                style={{
                  background:           active ? 'var(--accent)' : 'var(--surface)',
                  color:                active ? 'var(--accent-on)' : 'var(--ink)',
                  backdropFilter:       active ? undefined : 'blur(20px)',
                  WebkitBackdropFilter: active ? undefined : 'blur(20px)',
                  border:               '1px solid var(--glass-border)',
                }}
              >
                {r}
              </button>
            );
          })}
        </div>

        {/* ── Metric selector (single row, opens sheet) ── */}
        <motion.button
          onClick={() => setPickerOpen(true)}
          whileTap={{ scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="flex items-center justify-between w-full px-4 py-3.5 rounded-card"
          style={{
            background:           'var(--surface)',
            border:               '1px solid var(--glass-border)',
            backdropFilter:       'blur(24px) saturate(160%)',
            WebkitBackdropFilter: 'blur(24px) saturate(160%)',
            boxShadow:            'var(--glass-shadow)',
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--surface-tint-a)' }}
            >
              <PulseIcon className="w-4 h-4" style={{ color: 'var(--brand-green)' }} />
            </div>
            <div className="text-left">
              <p className="text-[10px] uppercase tracking-wider font-semibold leading-none mb-0.5" style={{ color: 'var(--ink-3)' }}>
                Viewing metric
              </p>
              <p className="text-sm font-semibold leading-tight" style={{ color: 'var(--ink)' }}>
                {selectedMetric.label}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="text-[10px] font-semibold px-2 py-1 rounded-full"
              style={{ background: 'var(--surface-tint-a)', color: 'var(--brand-green)' }}
            >
              {GROUP_LABELS[selectedMetric.group]}
            </span>
            {/* chevron down */}
            <svg fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24"
              className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--ink-3)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
            </svg>
          </div>
        </motion.button>

        {/* ── Analysis card ── */}
        <GlassCard className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-base font-bold leading-tight" style={{ color: 'var(--ink)' }}>
                {selectedMetric.label}
              </h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--ink-3)' }}>
                {range === 'All' ? 'All time' : `Last ${range}`}
              </p>
            </div>
            {trend.current !== null && (
              <div className="text-right">
                <div>
                  <span className="text-2xl font-bold tabular-nums" style={{ color: 'var(--ink)' }}>
                    {valueDisplay(trend.current)}
                  </span>
                  {unitDisplay() && (
                    <span className="text-sm ml-1" style={{ color: 'var(--ink-2)' }}>{unitDisplay()}</span>
                  )}
                </div>
                {trend.changePct !== null && Math.abs(trend.changePct) > 0.01 && (
                  <div
                    className="flex items-center gap-0.5 justify-end mt-0.5 text-[11px]"
                    style={{ color: trend.direction === 'up' ? 'var(--status-warn)' : 'var(--status-ok)' }}
                  >
                    {trend.direction === 'up'
                      ? <ArrowUpIcon className="w-3 h-3" />
                      : <ArrowDownIcon className="w-3 h-3" />}
                    <span>{Math.abs(trend.changePct).toFixed(1)}%</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <TrendChart
            measurements={filtered}
            metricKey={selectedMetric.key}
            label={selectedMetric.label}
            unit={unitDisplay()}
            height={180}
          />

          <div
            className="flex items-center justify-between mt-4 pt-4 border-t"
            style={{ borderColor: 'var(--glass-border)' }}
          >
            <Stat label="Rate" value={
              trend.rateKgPerWeek !== null && WEIGHT_KEYS.has(selectedMetric.key)
                ? `${trend.rateKgPerWeek > 0 ? '+' : ''}${trend.rateKgPerWeek.toFixed(2)} ${unitDisplay()}/wk`
                : '—'
            } />
            <Stat label="Stability" value={`${trend.stability}/100`} />
            <Stat label="Readings"  value={filtered.length.toString()} />
          </div>
        </GlassCard>

        {/* ── Measurements list, grouped by month ── */}
        <section className="flex flex-col gap-4">
          <h2 className="text-xs uppercase tracking-wider font-semibold px-1" style={{ color: 'var(--ink-3)' }}>
            All measurements
          </h2>

          <AnimatePresence mode="wait">
            {filtered.length === 0 ? (
              <motion.div key="empty" variants={fadeVariants} initial="initial" animate="animate" exit="exit">
                <GlassCard className="text-center py-10">
                  <div className="flex flex-col items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center"
                      style={{ background: 'var(--surface-strong)' }}
                    >
                      <ChartLineIcon className="w-5 h-5" style={{ color: 'var(--ink-3)' }} />
                    </div>
                    <p className="text-sm font-medium" style={{ color: 'var(--ink-2)' }}>No measurements in this range</p>
                    <p className="text-xs" style={{ color: 'var(--ink-3)' }}>Try selecting a wider time range above</p>
                  </div>
                </GlassCard>
              </motion.div>
            ) : (
              <motion.div
                key="list"
                className="flex flex-col gap-4"
                variants={staggerContainer(0.06)}
                initial="initial"
                animate="animate"
              >
                {grouped.map(({ label, items }) => (
                  <motion.div key={label} variants={cardVariants}>
                    {/* Month header */}
                    <div className="flex items-center gap-3 mb-2 px-1">
                      <p className="text-[11px] uppercase tracking-wider font-bold" style={{ color: 'var(--ink-3)' }}>
                        {label}
                      </p>
                      <div className="flex-1 h-px" style={{ background: 'var(--glass-border)' }} />
                      <p className="text-[11px] font-medium tabular-nums" style={{ color: 'var(--ink-3)' }}>
                        {items.length} {items.length === 1 ? 'reading' : 'readings'}
                      </p>
                    </div>

                    {/* Rows */}
                    <GlassCard padding={false} variant="glass" className="overflow-hidden">
                      {items.map((m, i) => {
                        const prev   = items[i + 1];
                        const wDelta = prev ? m.raw.weightKg - prev.raw.weightKg : null;
                        return (
                          <MeasurementRow
                            key={m.id}
                            measurement={m}
                            wDelta={wDelta}
                            settings={settings}
                            onDelete={() => handleDelete(m.id!)}
                            showDivider={i < items.length - 1}
                          />
                        );
                      })}
                    </GlassCard>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </div>

      {/* ── Metric picker bottom sheet ── */}
      <AnimatePresence>
        {pickerOpen && (
          <MetricPickerSheet
            selectedKey={metricKey}
            group={pickerGroup}
            onGroupChange={setPickerGroup}
            metrics={pickerMetrics}
            onSelect={(key) => { setMetricKey(key); setPickerOpen(false); }}
            onClose={() => setPickerOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function MeasurementRow({
  measurement: m, wDelta, settings, onDelete, showDivider,
}: {
  measurement: Measurement;
  wDelta: number | null;
  settings: AppSettings;
  onDelete: () => void;
  showDivider?: boolean;
}) {
  const d    = new Date(m.timestamp);
  const day  = d.getDate();
  const mon  = d.toLocaleDateString('en-US', { month: 'short' });
  const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  return (
    <div
      className="flex items-center gap-3 px-4 py-3.5"
      style={showDivider ? { borderBottom: '1px solid var(--glass-border)' } : undefined}
    >
      {/* Date badge */}
      <div
        className="w-11 h-11 rounded-xl flex flex-col items-center justify-center flex-shrink-0"
        style={{ background: 'var(--surface-strong)' }}
      >
        <span className="text-[9px] uppercase leading-none font-semibold" style={{ color: 'var(--ink-3)' }}>
          {mon}
        </span>
        <span className="text-base font-bold leading-tight tabular-nums" style={{ color: 'var(--ink)' }}>
          {day}
        </span>
      </div>

      {/* Main info */}
      <div className="flex-1 min-w-0">
        <p className="text-base font-bold tabular-nums leading-tight" style={{ color: 'var(--ink)' }}>
          {formatWeight(m.raw.weightKg, settings.weightUnit)}
        </p>
        <p className="text-[11px] mt-0.5" style={{ color: 'var(--ink-3)' }}>
          <span>BMI {m.raw.bmi.toFixed(1)}</span>
          <span className="mx-1.5" style={{ color: 'var(--glass-border)' }}>·</span>
          <span>Fat {m.raw.fatRatioPct.toFixed(1)}%</span>
          <span className="mx-1.5" style={{ color: 'var(--glass-border)' }}>·</span>
          <span>{time}</span>
        </p>
      </div>

      {/* Right: delta + delete */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {wDelta !== null && (
          <span
            className="text-[11px] font-semibold px-2 py-0.5 rounded-full tabular-nums"
            style={{
              background: `color-mix(in srgb, var(--status-${wDelta <= 0 ? 'ok' : 'alert'}) 14%, transparent)`,
              color:      wDelta <= 0 ? 'var(--status-ok)' : 'var(--status-alert)',
            }}
          >
            {wDelta > 0 ? '+' : ''}{formatWeightValue(Math.abs(wDelta), settings.weightUnit)}
          </span>
        )}
        <button
          onClick={onDelete}
          aria-label="Delete measurement"
          className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
          style={{ color: 'var(--ink-3)' }}
        >
          <svg fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function MetricPickerSheet({
  selectedKey, group, onGroupChange, metrics, onSelect, onClose,
}: {
  selectedKey: string;
  group: MetricGroupKey | 'all';
  onGroupChange: (g: MetricGroupKey | 'all') => void;
  metrics: MetricDef[];
  onSelect: (key: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end pb-24">
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0"
        variants={backdropVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />

      {/* Sheet panel */}
      <motion.div
        className="relative z-10 rounded-t-[28px] flex flex-col"
        variants={sheetVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        style={{
          background:           'var(--surface-strong)',
          backdropFilter:       'blur(36px) saturate(180%)',
          WebkitBackdropFilter: 'blur(36px) saturate(180%)',
          border:               '1px solid var(--glass-border)',
          borderBottom:         'none',
          boxShadow:            'var(--glass-shadow-lg)',
          maxHeight:            '72dvh',
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--glass-border)' }} />
        </div>

        {/* Title row */}
        <div className="flex items-center justify-between px-5 pt-2 pb-3">
          <h2 className="text-base font-bold" style={{ color: 'var(--ink)' }}>Choose metric</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'var(--surface-strong)', color: 'var(--ink-2)' }}
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Group tabs */}
        <div className="flex gap-1.5 overflow-x-auto px-5 pb-3 scrollbar-none flex-shrink-0">
          <GroupTab label="All" active={group === 'all'} onClick={() => onGroupChange('all')} />
          {GROUP_ORDER.map(g => (
            <GroupTab
              key={g}
              label={GROUP_LABELS[g]}
              active={group === g}
              onClick={() => onGroupChange(g)}
            />
          ))}
        </div>

        {/* Metric grid — scrollable */}
        <div className="overflow-y-auto px-5 pb-8 flex-1">
          <div className="grid grid-cols-2 gap-2">
            {metrics.map(m => {
              const active = selectedKey === m.key;
              return (
                <motion.button
                  key={m.key}
                  onClick={() => onSelect(m.key)}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className="flex items-center justify-between gap-2 px-3 py-3 rounded-[16px] text-left"
                  style={{
                    background: active ? 'var(--accent)' : 'var(--surface)',
                    border:     `1px solid ${active ? 'transparent' : 'var(--glass-border)'}`,
                    backdropFilter:       'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                  }}
                >
                  <div className="min-w-0">
                    <p
                      className="text-xs font-semibold leading-tight truncate"
                      style={{ color: active ? 'var(--accent-on)' : 'var(--ink)' }}
                    >
                      {m.label}
                    </p>
                    {m.unit && (
                      <p
                        className="text-[10px] mt-0.5 leading-none"
                        style={{ color: active ? `color-mix(in srgb, var(--accent-on) 65%, transparent)` : 'var(--ink-3)' }}
                      >
                        {m.unit}
                      </p>
                    )}
                    <p
                      className="text-[10px] mt-1 leading-snug line-clamp-2"
                      style={{ color: active ? `color-mix(in srgb, var(--accent-on) 55%, transparent)` : 'var(--ink-3)', opacity: active ? 1 : 0.8 }}
                    >
                      {m.description}
                    </p>
                  </div>
                  {active && <CheckIcon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--accent-on)' }} />}
                </motion.button>
              );
            })}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex-1 flex flex-col items-center">
      <span className="text-sm font-semibold tabular-nums" style={{ color: 'var(--ink)' }}>{value}</span>
      <span className="text-[10px] uppercase tracking-wider mt-0.5" style={{ color: 'var(--ink-3)' }}>{label}</span>
    </div>
  );
}

function GroupTab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 px-3 py-1.5 rounded-pill text-[11px] font-semibold transition-colors"
      style={{
        background:           active ? 'var(--accent)' : 'var(--surface)',
        color:                active ? 'var(--accent-on)' : 'var(--ink-2)',
        border:               '1px solid var(--glass-border)',
        backdropFilter:       'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      {label}
    </button>
  );
}
