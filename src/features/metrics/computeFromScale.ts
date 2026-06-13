/**
 * Compute all 26 RawMeasurement fields from the 3 values the scale actually
 * sends over BLE (weight, impedance, heart rate) plus the user profile.
 *
 * Formulas:
 *   BMI            — direct (weight / height²)
 *   BMR            — Mifflin-St Jeor 1990
 *   Body Fat %     — Deurenberg et al. 1991 (BMI-based; ±4% SE)
 *   Total Body Water — Watson et al. 1980
 *   Skeletal Muscle Mass — Janssen et al. 2000 (needs impedance)
 *   Standard Weight — Devine/Robinson/Hamwi midpoint
 *   Bone mass      — Pietrobelli 1998 estimate (~3-4% body weight)
 *   Protein        — Roche 1996: ~16% of LBM
 *   Minerals       — Roche 1996: ~6% of LBM
 *   Visceral fat   — Kuk et al. 2009 age+BF% approximation
 */

import type { RawMeasurement, Sex, ActivityLevel, User } from '@/shared/db/types';

interface ScaleInputs {
  weightKg: number;
  impedanceOhms: number | null;
  heartRateBpm: number | null;
}

function ageFromDob(dob: string): number {
  const birth = new Date(dob);
  const now   = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  if (
    now.getMonth() < birth.getMonth() ||
    (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())
  ) age--;
  return age;
}

function round1(n: number) { return Math.round(n * 10) / 10; }

export function computeRawFromScale(scale: ScaleInputs, user: User): RawMeasurement {
  const { weightKg, impedanceOhms, heartRateBpm } = scale;
  const { sex, heightCm, dob, targetWeightKg } = user;
  const age     = ageFromDob(dob);
  const heightM = heightCm / 100;

  // BMI
  const bmi = weightKg / (heightM * heightM);

  // BMR — Mifflin-St Jeor 1990
  const bmrKcal = Math.round(
    sex === 'male'
      ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
      : 10 * weightKg + 6.25 * heightCm - 5 * age - 161
  );

  // Body Fat % — Deurenberg et al. 1991
  const fatRatioPct = Math.max(3, round1(
    1.20 * bmi + 0.23 * age - 10.8 * (sex === 'male' ? 1 : 0) - 5.4
  ));

  const fatMassKg      = round1((fatRatioPct / 100) * weightKg);
  const leanBodyMassKg = round1(weightKg - fatMassKg);

  // Total Body Water — Watson et al. 1980
  const totalBodyWaterKg = round1(
    sex === 'male'
      ? 2.447 - 0.09156 * age + 0.1074 * heightCm + 0.3362 * weightKg
      : -2.097 + 0.1069 * heightCm + 0.2466 * weightKg
  );
  const waterRatioPct = round1((totalBodyWaterKg / weightKg) * 100);

  // Skeletal Muscle Mass — Janssen et al. 2000 (uses impedance)
  // Falls back to population estimate when impedance unavailable
  let skeletalMuscleMassKg: number;
  if (impedanceOhms && impedanceOhms > 50) {
    // SMM = (H²/R) × 0.401 + sex_factor − age × 0.071 + 5.102
    const sexFactor = sex === 'male' ? 3.825 : 0;
    skeletalMuscleMassKg = Math.max(1,
      (heightCm * heightCm / impedanceOhms) * 0.401 + sexFactor - age * 0.071 + 5.102
    );
  } else {
    // Estimate: SMM ≈ lean body mass × 0.55 (male) or 0.50 (female)
    skeletalMuscleMassKg = leanBodyMassKg * (sex === 'male' ? 0.55 : 0.50);
  }
  skeletalMuscleMassKg = round1(skeletalMuscleMassKg);

  // Total muscle ≈ SMM × 1.18 (includes smooth + cardiac muscle — Janssen 2000)
  const muscleMassKg         = round1(skeletalMuscleMassKg * 1.18);
  const muscleRatioPct       = round1((muscleMassKg / weightKg) * 100);
  const skeletalMuscleRatioPct = round1((skeletalMuscleMassKg / weightKg) * 100);

  // Bone Mass estimate — ~3% body weight (Pietrobelli 1998)
  const boneMassKg = round1(Math.max(
    sex === 'male' ? 1.5 : 1.0,
    weightKg * (sex === 'male' ? 0.032 : 0.028)
  ));

  // Protein ≈ 16% of LBM (Roche 1996)
  const proteinMassKg  = round1(leanBodyMassKg * 0.16);
  const proteinRatioPct = round1((proteinMassKg / weightKg) * 100);

  // Minerals ≈ 6% of LBM (Roche 1996)
  const mineralMassKg = round1(leanBodyMassKg * 0.06);

  // Subcutaneous fat ≈ 85% of total fat (rest is visceral + intramuscular)
  const subcutaneousFatMassKg  = round1(fatMassKg * 0.85);
  const subcutaneousFatRatioPct = round1((subcutaneousFatMassKg / weightKg) * 100);

  // Visceral fat level (1–59) — Kuk et al. 2009 approximation
  const visceralFatLevel = Math.min(59, Math.max(1, Math.round(
    (fatRatioPct - (sex === 'male' ? 8 : 13)) * 0.38 + (age - 20) * 0.18
  )));

  // Standard weight — midpoint of Devine/Robinson/Hamwi
  const heightIn  = heightCm / 2.54;
  const excess    = Math.max(0, heightIn - 60);
  const ideals = sex === 'male'
    ? [50 + 2.3 * excess, 52 + 1.9 * excess, 48 + 2.7 * excess]
    : [45.5 + 2.3 * excess, 49 + 1.7 * excess, 45.4 + 2.3 * excess];
  const standardWeightKg = round1((Math.min(...ideals) + Math.max(...ideals)) / 2);
  const weightControlKg  = round1(targetWeightKg - weightKg);

  // Body Age — offset from chronological based on fat deviation
  const avgFatForAge = sex === 'male' ? 18 + age * 0.1 : 28 + age * 0.1;
  const bodyAge = Math.max(15, Math.min(80, Math.round(age + (fatRatioPct - avgFatForAge) * 0.6)));

  // Body Type
  let bodyType = 'Normal';
  const leanFatThreshold = sex === 'male' ? 14 : 21;
  const obeseFatThreshold = sex === 'male' ? 25 : 32;
  if (fatRatioPct < leanFatThreshold && muscleRatioPct > 42) bodyType = 'Athletic';
  else if (fatRatioPct < leanFatThreshold) bodyType = 'Lean';
  else if (fatRatioPct >= obeseFatThreshold) bodyType = 'Obese';

  // Health Score (0–100)
  const bmiOk  = bmi >= 18.5 && bmi < 25;
  const fatOk  = sex === 'male' ? fatRatioPct >= 6 && fatRatioPct <= 24 : fatRatioPct >= 14 && fatRatioPct <= 31;
  const waterOk = sex === 'male' ? waterRatioPct >= 60 : waterRatioPct >= 45;
  const hrOk   = !heartRateBpm || (heartRateBpm >= 60 && heartRateBpm <= 100);
  const healthScore = (bmiOk ? 25 : 10) + (fatOk ? 25 : 10) + (waterOk ? 25 : 15) + (hrOk ? 25 : 15);
  const healthEvaluation =
    healthScore >= 90 ? 'Excellent' :
    healthScore >= 75 ? 'Good' :
    healthScore >= 55 ? 'Average' : 'Needs Improvement';

  return {
    weightKg:              round1(weightKg),
    standardWeightKg,
    bmi:                   round1(bmi),
    bmrKcal,
    heartRateBpm:          heartRateBpm ?? 0,
    waterRatioPct,
    totalBodyWaterKg,
    boneMassKg,
    muscleMassKg,
    muscleRatioPct,
    skeletalMuscleMassKg,
    skeletalMuscleRatioPct,
    fatRatioPct,
    fatMassKg,
    visceralFatLevel,
    subcutaneousFatRatioPct,
    subcutaneousFatMassKg,
    leanBodyMassKg,
    proteinRatioPct,
    proteinMassKg,
    mineralMassKg,
    bodyType,
    bodyAge,
    healthScore,
    healthEvaluation,
    weightControlKg,
  };
}
