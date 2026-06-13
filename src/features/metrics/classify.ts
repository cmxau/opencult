import type { Sex } from '@/shared/db/types';

export type MetricStatus = 'low' | 'normal' | 'high' | 'alert' | 'optimal' | 'unknown';

export interface ClassificationResult {
  status: MetricStatus;
  referenceLabel: string;
}

export function classifyBMI(bmi: number): ClassificationResult {
  if (bmi < 18.5) return { status: 'low',    referenceLabel: '18.5–24.9' };
  if (bmi <= 24.9) return { status: 'normal',  referenceLabel: '18.5–24.9' };
  if (bmi <= 35)  return { status: 'high',    referenceLabel: '18.5–24.9' };
  return               { status: 'alert',    referenceLabel: '18.5–24.9' };
}

export function classifyVisceralFat(level: number): ClassificationResult {
  if (level <= 9)  return { status: 'normal', referenceLabel: '1–9' };
  if (level <= 14) return { status: 'high',   referenceLabel: '1–9' };
  return                  { status: 'alert',  referenceLabel: '1–9' };
}

export function classifyHeartRate(bpm: number): ClassificationResult {
  if (bpm < 60)   return { status: 'low',    referenceLabel: '60–100 bpm' };
  if (bpm <= 100) return { status: 'normal', referenceLabel: '60–100 bpm' };
  return                 { status: 'high',   referenceLabel: '60–100 bpm' };
}

export function classifyFatRatio(pct: number, sex: Sex): ClassificationResult {
  const [lo, hi] = sex === 'male' ? [6, 24] : [14, 31];
  if (pct < lo)  return { status: 'low',    referenceLabel: `${lo}–${hi}%` };
  if (pct <= hi) return { status: 'normal', referenceLabel: `${lo}–${hi}%` };
  return                { status: 'high',   referenceLabel: `${lo}–${hi}%` };
}

export function classifyWaterRatio(pct: number, sex: Sex): ClassificationResult {
  const [lo, hi] = sex === 'male' ? [60, 65] : [45, 60];
  if (pct < lo)  return { status: 'low',     referenceLabel: `${lo}–${hi}%` };
  if (pct <= hi) return { status: 'optimal', referenceLabel: `${lo}–${hi}%` };
  return                { status: 'high',    referenceLabel: `${lo}–${hi}%` };
}

export function classifyFFMI(ffmi: number, sex: Sex): ClassificationResult {
  const [lo, hi] = sex === 'male' ? [17, 22] : [14, 17];
  if (ffmi < lo)  return { status: 'low',     referenceLabel: `${lo}–${hi}` };
  if (ffmi <= hi) return { status: 'normal',  referenceLabel: `${lo}–${hi}` };
  return                 { status: 'optimal', referenceLabel: `${lo}–${hi}` };
}

export function classifyASMI(asmi: number, sex: Sex): ClassificationResult {
  const threshold = sex === 'male' ? 7.26 : 5.45;
  if (asmi < threshold) return { status: 'low',    referenceLabel: `≥${threshold}` };
  return                       { status: 'normal', referenceLabel: `≥${threshold}` };
}

export function classifyMuscleFatRatio(ratio: number): ClassificationResult {
  if (ratio < 1)  return { status: 'low',     referenceLabel: '>1.0' };
  if (ratio < 2)  return { status: 'normal',  referenceLabel: '>1.0' };
  return                 { status: 'optimal', referenceLabel: '>1.0' };
}

export function unclassified(referenceLabel = '—'): ClassificationResult {
  return { status: 'unknown', referenceLabel };
}
