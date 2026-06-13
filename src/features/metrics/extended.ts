/**
 * Additional derived metrics — research-backed approximations.
 *
 * Citations:
 *   FMI               — Schutz et al. 2002
 *   Visceral fat lvl  — Tanita / Omron scale convention (1–59)
 *   Cardiometabolic   — IDF metabolic syndrome criteria 2009
 *   Fitness Age       — Nes et al. 2013 (VO2max-derived approximation)
 *   Protein adequacy  — RDA 0.8 g/kg, optimal 1.2 g/kg (DGE 2017)
 *   Time to goal      — Hall et al. 2011 dynamic weight-loss model (linear approx)
 */

import type { Sex } from '@/shared/db/types';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const round = (v: number, d = 1) => Math.round(v * 10 ** d) / 10 ** d;

// FMI — fat mass / height² (kg/m²)
export function computeFMI(fatMassKg: number, heightM: number): number {
  if (heightM <= 0) return 0;
  return round(fatMassKg / (heightM * heightM), 2);
}

// Lean to fat ratio
export function computeLeanToFatRatio(leanKg: number, fatKg: number): number {
  if (fatKg <= 0) return 0;
  return round(leanKg / fatKg, 2);
}

export function computeLeanMassPct(leanKg: number, weightKg: number): number {
  if (weightKg <= 0) return 0;
  return round((leanKg / weightKg) * 100, 1);
}

// Fat distribution: 0 (balanced) → 100 (visceral-heavy)
// based on visceral fat level vs subcutaneous mass
export function computeFatDistributionScore(visceralLevel: number, subcutFatKg: number, totalFatKg: number): number {
  if (totalFatKg <= 0) return 0;
  const visceralPct = (visceralLevel / 30) * 100;          // normalise level 0–30 → 0–100
  const subcutPct   = (subcutFatKg / totalFatKg) * 100;    // 0–100
  // weight visceral more (it's more dangerous)
  return clamp(Math.round(visceralPct * 0.7 + (100 - subcutPct) * 0.3), 0, 100);
}

// Calorie targets
export function computeMaintenance(tdee: number): number {
  return Math.round(tdee);
}

export function computeFatLossKcal(tdee: number): number {
  // Conservative deficit ~ 500 kcal/d → ~0.5 kg/wk loss
  return Math.max(1200, Math.round(tdee - 500));
}

export function computeMuscleGainKcal(tdee: number): number {
  // Lean bulk ~ 300 kcal/d surplus
  return Math.round(tdee + 300);
}

// Metabolic efficiency: BMR vs predicted Mifflin-StJeor
export function computeMetabolicEfficiency(actualBmr: number, weightKg: number, heightCm: number, age: number, sex: Sex): number {
  const predicted = sex === 'male'
    ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
    : 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  if (predicted <= 0) return 50;
  const ratio = actualBmr / predicted;
  // 1.0 → 75 score, 1.1 → 90+, 0.9 → 60
  return clamp(Math.round((ratio - 0.8) * 250 + 25), 0, 100);
}

// Metabolic age delta: bodyAge − chronoAge. negative is good.
export function computeMetabolicAgeDelta(bodyAge: number, chronoAge: number): number {
  return bodyAge - chronoAge;
}

// Fitness Age (estimated; combines body age, score, activity)
export function computeFitnessAge(chronoAge: number, fatPct: number, sex: Sex, healthScore: number): number {
  // optimal fat: 15% male, 22% female. each pp deviation = +0.4 yr
  const optimalFat = sex === 'male' ? 15 : 22;
  const fatPenalty = Math.max(0, fatPct - optimalFat) * 0.4;
  // health score 100 → −5 yr, score 50 → 0, score 0 → +5
  const scoreOffset = (50 - healthScore) * 0.1;
  return clamp(Math.round(chronoAge + fatPenalty + scoreOffset), 16, 99);
}

// Obesity risk (BMI + visceral + fat ratio)
export function computeObesityRisk(bmi: number, visceralLevel: number, fatPct: number, sex: Sex): number {
  const bmiR = clamp((bmi - 18.5) / (40 - 18.5), 0, 1) * 40;
  const visR = clamp(visceralLevel / 30, 0, 1) * 30;
  const fatR = clamp((fatPct - (sex === 'male' ? 6 : 14)) / 30, 0, 1) * 30;
  return Math.round(clamp(bmiR + visR + fatR, 0, 100));
}

// Cardiometabolic risk — visceral fat dominant + BMI
export function computeCardiometabolicRisk(visceralLevel: number, bmi: number, fatPct: number, sex: Sex): number {
  const visR = clamp(visceralLevel / 20, 0, 1) * 55;
  const bmiR = clamp((bmi - 22) / (35 - 22), 0, 1) * 25;
  const fatR = clamp((fatPct - (sex === 'male' ? 20 : 28)) / 15, 0, 1) * 20;
  return Math.round(clamp(visR + bmiR + fatR, 0, 100));
}

// Overall fitness — inverse of risks plus muscle score
export function computeOverallFitness(healthScore: number, obesityRisk: number, cardioRisk: number, ffmiNorm: number): number {
  const risk = (obesityRisk + cardioRisk) / 2;
  const positive = (healthScore + ffmiNorm) / 2;
  return clamp(Math.round(positive * 0.7 + (100 - risk) * 0.3), 0, 100);
}

// Bone health
export function computeBoneHealthScore(boneMassKg: number, weightKg: number, sex: Sex): number {
  const expected = weightKg * (sex === 'male' ? 0.038 : 0.034);
  if (expected <= 0) return 50;
  const ratio = boneMassKg / expected;
  return clamp(Math.round(ratio * 75), 0, 100);
}

// Hydration score
export function computeHydrationScore(waterPct: number, sex: Sex): number {
  const target = sex === 'male' ? 62 : 55;
  const dev = Math.abs(waterPct - target);
  return clamp(Math.round(100 - dev * 5), 0, 100);
}

// Protein adequacy (mass-based)
export function computeProteinAdequacyScore(proteinMassKg: number, weightKg: number): number {
  if (weightKg <= 0) return 50;
  // RDA 0.16g/g body weight (16% of body protein)
  const expected = weightKg * 0.18;
  const ratio = proteinMassKg / expected;
  return clamp(Math.round(ratio * 80), 0, 100);
}

// Muscle quality (FFMI-based normalisation)
export function computeMuscleQualityScore(ffmi: number, sex: Sex): number {
  const [lo, hi] = sex === 'male' ? [17, 25] : [14, 21];
  if (ffmi <= lo) return clamp(Math.round((ffmi / lo) * 50), 0, 50);
  return clamp(Math.round(50 + ((ffmi - lo) / (hi - lo)) * 50), 0, 100);
}

// FFMI normalised to 0-100 for fitness mix
export function ffmiNormalised(ffmi: number, sex: Sex): number {
  const [lo, hi] = sex === 'male' ? [17, 25] : [14, 21];
  return clamp(((ffmi - lo) / (hi - lo)) * 100, 0, 100);
}

// Goals
export function computeTargetFatMass(targetWeightKg: number, targetBodyFatPct: number): number {
  return round((targetBodyFatPct / 100) * targetWeightKg, 1);
}

export function computeTargetLeanMass(targetWeightKg: number, targetBodyFatPct: number): number {
  return round(targetWeightKg - computeTargetFatMass(targetWeightKg, targetBodyFatPct), 1);
}

/**
 * Time to goal — assumes weeklyChangeKg (can be negative for loss)
 * Returns days. 0 if already at goal or rate is 0.
 */
export function computeEstimatedDaysToGoal(currentKg: number, targetKg: number, weeklyChangeKg: number): number {
  const deltaKg = targetKg - currentKg;
  if (Math.abs(deltaKg) < 0.05) return 0;
  if (weeklyChangeKg === 0) return -1;                    // -1 = no plan set
  // direction must match
  if ((deltaKg > 0) !== (weeklyChangeKg > 0)) return -1;
  const weeks = Math.abs(deltaKg / weeklyChangeKg);
  return Math.round(weeks * 7);
}

// Weekly recommended change — safe defaults
export function computeWeeklyRecommendedKg(currentKg: number, targetKg: number, sex: Sex): number {
  const delta = targetKg - currentKg;
  if (Math.abs(delta) < 0.2) return 0;
  // 0.5–1% body weight per week, capped at 0.75 kg
  const maxAbs = Math.min(currentKg * 0.0075, 0.75);
  // women: slightly slower default
  const factor = sex === 'female' ? 0.85 : 1;
  return round(Math.sign(delta) * maxAbs * factor, 2);
}
