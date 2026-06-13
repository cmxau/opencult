/**
 * Trend analytics across measurement history.
 */
import type { Measurement } from '@/shared/db/types';

const MS_PER_DAY = 86_400_000;

function extractValue(m: Measurement, key: string): number | null {
  const raw     = m.raw     as unknown as Record<string, unknown>;
  const derived = m.derived as unknown as Record<string, unknown>;
  const v = raw[key] ?? derived[key];
  return typeof v === 'number' ? v : null;
}

export interface TrendStats {
  current:     number | null;
  previous:    number | null;
  changeAbs:   number | null;
  changePct:   number | null;
  rateKgPerWeek: number | null;
  direction:   'up' | 'down' | 'flat' | 'na';
  stability:   number;          // 0–100 (100 = very stable)
}

/**
 * Compute trend over the given measurements (assumes newest first).
 */
export function trendFor(measurements: Measurement[], key: string): TrendStats {
  const values = measurements
    .map(m => ({ v: extractValue(m, key), t: new Date(m.timestamp).getTime() }))
    .filter((d): d is { v: number; t: number } => d.v !== null);

  if (values.length === 0) {
    return { current: null, previous: null, changeAbs: null, changePct: null, rateKgPerWeek: null, direction: 'na', stability: 0 };
  }
  if (values.length === 1) {
    return { current: values[0].v, previous: null, changeAbs: null, changePct: null, rateKgPerWeek: null, direction: 'flat', stability: 100 };
  }

  const current  = values[0].v;
  const oldest   = values[values.length - 1];
  const changeAbs = current - oldest.v;
  const changePct = oldest.v !== 0 ? (changeAbs / oldest.v) * 100 : null;

  const days = (values[0].t - oldest.t) / MS_PER_DAY;
  const rateKgPerWeek = days > 0 ? (changeAbs / days) * 7 : 0;

  const direction = Math.abs(changePct ?? 0) < 0.5 ? 'flat' : changeAbs > 0 ? 'up' : 'down';

  // Stability — inverse of std deviation
  const mean = values.reduce((s, d) => s + d.v, 0) / values.length;
  const variance = values.reduce((s, d) => s + (d.v - mean) ** 2, 0) / values.length;
  const std = Math.sqrt(variance);
  const cv  = mean !== 0 ? std / Math.abs(mean) : 0;
  const stability = Math.max(0, Math.min(100, Math.round(100 - cv * 200)));

  return { current, previous: values[1]?.v ?? null, changeAbs, changePct, rateKgPerWeek, direction, stability };
}

/**
 * Body recomposition score — fat going down + muscle going up = high score.
 */
export function bodyRecompositionScore(measurements: Measurement[]): number {
  const fat    = trendFor(measurements, 'fatRatioPct');
  const muscle = trendFor(measurements, 'muscleMassKg');
  // weight fat reduction (positive when negative change) and muscle gain (positive when positive change)
  const fatScore   = fat.changePct    !== null ? Math.max(-5, Math.min(5, -fat.changePct)) : 0;
  const muscleScore = muscle.changePct !== null ? Math.max(-5, Math.min(5, muscle.changePct)) : 0;
  return Math.round(50 + (fatScore + muscleScore) * 5);
}
