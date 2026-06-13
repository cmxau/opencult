import type { RawMeasurement, DerivedMetrics, ActivityLevel, Sex, Goals } from '@/shared/db/types';
import {
  computeFFMI,
  computeASMI,
  computeMuscleFatRatio,
  computeObesityClass,
  computeBodyFatCategory,
  computeHydrationCategory,
  computeTDEE,
  computeIdealWeightRange,
} from './formulas';
import {
  computeFMI,
  computeLeanToFatRatio,
  computeLeanMassPct,
  computeFatDistributionScore,
  computeMaintenance,
  computeFatLossKcal,
  computeMuscleGainKcal,
  computeMetabolicEfficiency,
  computeMetabolicAgeDelta,
  computeFitnessAge,
  computeObesityRisk,
  computeCardiometabolicRisk,
  computeOverallFitness,
  computeBoneHealthScore,
  computeHydrationScore,
  computeProteinAdequacyScore,
  computeMuscleQualityScore,
  ffmiNormalised,
  computeTargetFatMass,
  computeTargetLeanMass,
  computeEstimatedDaysToGoal,
  computeWeeklyRecommendedKg,
} from './extended';

interface UserProfile {
  sex: Sex;
  heightCm: number;
  activityLevel: ActivityLevel;
  dob?: string;
  targetWeightKg?: number;
  goals?: Goals;
}

function ageFromDob(dob?: string): number {
  if (!dob) return 30;
  const birth = new Date(dob);
  const now   = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  if (
    now.getMonth() < birth.getMonth() ||
    (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())
  ) age--;
  return age;
}

export function computeDerivedMetrics(raw: RawMeasurement, user: UserProfile): DerivedMetrics {
  const heightM = user.heightCm / 100;
  const age     = ageFromDob(user.dob);

  const ffmi = computeFFMI(raw.leanBodyMassKg, heightM);
  const tdee = computeTDEE(raw.bmrKcal, user.activityLevel);
  const ffmiNorm = ffmiNormalised(ffmi, user.sex);

  const obesityRisk = computeObesityRisk(raw.bmi, raw.visceralFatLevel, raw.fatRatioPct, user.sex);
  const cardioRisk  = computeCardiometabolicRisk(raw.visceralFatLevel, raw.bmi, raw.fatRatioPct, user.sex);

  const goals = user.goals;
  const targetWeightKg   = goals?.targetWeightKg   ?? user.targetWeightKg ?? raw.weightKg;
  const targetBodyFatPct = goals?.targetBodyFatPct ?? (user.sex === 'male' ? 15 : 22);
  const weeklyChangeKg   = goals?.weeklyChangeRateKg ?? computeWeeklyRecommendedKg(raw.weightKg, targetWeightKg, user.sex);

  return {
    ffmi,
    fmi:                computeFMI(raw.fatMassKg, heightM),
    asmi:               computeASMI(raw.skeletalMuscleMassKg, heightM),
    leanToFatRatio:     computeLeanToFatRatio(raw.leanBodyMassKg, raw.fatMassKg),
    skeletalMuscleToFatRatio: computeLeanToFatRatio(raw.skeletalMuscleMassKg, raw.fatMassKg),
    muscleFatRatio:     computeMuscleFatRatio(raw.muscleMassKg, raw.fatMassKg),
    leanMassPct:        computeLeanMassPct(raw.leanBodyMassKg, raw.weightKg),
    fatDistributionScore: computeFatDistributionScore(raw.visceralFatLevel, raw.subcutaneousFatMassKg, raw.fatMassKg),

    obesityClass:       computeObesityClass(raw.bmi),
    hydrationCategory:  computeHydrationCategory(raw.waterRatioPct, user.sex),
    bodyFatCategory:    computeBodyFatCategory(raw.fatRatioPct, user.sex),

    tdee,
    maintenanceKcal:    computeMaintenance(tdee),
    fatLossKcal:        computeFatLossKcal(tdee),
    muscleGainKcal:     computeMuscleGainKcal(tdee),
    metabolicEfficiencyScore: computeMetabolicEfficiency(raw.bmrKcal, raw.weightKg, user.heightCm, age, user.sex),
    metabolicAgeDelta:  computeMetabolicAgeDelta(raw.bodyAge, age),

    fitnessAge:         computeFitnessAge(age, raw.fatRatioPct, user.sex, raw.healthScore),
    overallFitnessScore: computeOverallFitness(raw.healthScore, obesityRisk, cardioRisk, ffmiNorm),
    obesityRiskScore:   obesityRisk,
    cardiometabolicRiskScore: cardioRisk,
    boneHealthScore:    computeBoneHealthScore(raw.boneMassKg, raw.weightKg, user.sex),
    hydrationScore:     computeHydrationScore(raw.waterRatioPct, user.sex),
    proteinAdequacyScore: computeProteinAdequacyScore(raw.proteinMassKg, raw.weightKg),
    muscleQualityScore: computeMuscleQualityScore(ffmi, user.sex),

    idealWeightRangeKg: computeIdealWeightRange(user.heightCm, user.sex),
    targetFatMassKg:    computeTargetFatMass(targetWeightKg, targetBodyFatPct),
    targetLeanMassKg:   computeTargetLeanMass(targetWeightKg, targetBodyFatPct),
    estimatedDaysToGoal: computeEstimatedDaysToGoal(raw.weightKg, targetWeightKg, weeklyChangeKg),
    weeklyRecommendedKg: weeklyChangeKg,
  };
}

/**
 * Category map for grouping in History/Insights views.
 */
export type MetricGroupKey = 'measurements' | 'fat' | 'muscle' | 'lean' | 'water' | 'bone' | 'protein' | 'metabolism' | 'health' | 'advanced' | 'goals';

export interface MetricDef {
  key: string;
  label: string;
  unit: string;
  group: MetricGroupKey;
  source: 'raw' | 'derived';
  description: string;
}

export const METRIC_DEFS: MetricDef[] = [
  // Measurements
  { key: 'weightKg',          label: 'Weight',           unit: 'kg',    group: 'measurements', source: 'raw',     description: 'Total body mass on the scale' },
  { key: 'standardWeightKg',  label: 'Standard weight',  unit: 'kg',    group: 'measurements', source: 'raw',     description: 'Weight adjusted for body composition' },
  { key: 'bmi',               label: 'BMI',              unit: '',      group: 'measurements', source: 'raw',     description: 'Body mass relative to height squared' },
  { key: 'heartRateBpm',      label: 'Heart rate',       unit: 'bpm',   group: 'measurements', source: 'raw',     description: 'Resting beats per minute' },

  // Fat
  { key: 'fatRatioPct',           label: 'Fat ratio',           unit: '%',  group: 'fat', source: 'raw',     description: 'Body fat as a percentage of total weight' },
  { key: 'fatMassKg',              label: 'Fat mass',            unit: 'kg', group: 'fat', source: 'raw',     description: 'Total weight of fat in the body' },
  { key: 'visceralFatLevel',       label: 'Visceral fat',        unit: '',   group: 'fat', source: 'raw',     description: 'Fat around internal organs — 1–9 is healthy' },
  { key: 'subcutaneousFatRatioPct',label: 'Subcutaneous fat %',  unit: '%',  group: 'fat', source: 'raw',     description: 'Fat stored under the skin as % of weight' },
  { key: 'subcutaneousFatMassKg',  label: 'Subcutaneous fat',    unit: 'kg', group: 'fat', source: 'raw',     description: 'Weight of fat stored directly under the skin' },

  // Muscle
  { key: 'muscleMassKg',           label: 'Muscle mass',         unit: 'kg', group: 'muscle', source: 'raw',     description: 'Total weight of all muscle tissue' },
  { key: 'muscleRatioPct',         label: 'Muscle ratio',        unit: '%',  group: 'muscle', source: 'raw',     description: 'Muscle as a percentage of total body weight' },
  { key: 'skeletalMuscleMassKg',   label: 'Skeletal muscle',     unit: 'kg', group: 'muscle', source: 'raw',     description: 'Muscles attached to bones that you control' },
  { key: 'skeletalMuscleRatioPct', label: 'Skeletal muscle %',   unit: '%',  group: 'muscle', source: 'raw',     description: 'Skeletal muscle as a percentage of body weight' },

  // Lean
  { key: 'leanBodyMassKg',         label: 'Lean body mass',      unit: 'kg', group: 'lean', source: 'raw',     description: 'Everything except fat — muscle, bone, water, organs' },

  // Water
  { key: 'waterRatioPct',          label: 'Water ratio',         unit: '%',  group: 'water', source: 'raw',     description: 'Total body water as a percentage of weight' },
  { key: 'totalBodyWaterKg',       label: 'Total body water',    unit: 'kg', group: 'water', source: 'raw',     description: 'Total weight of water in the body' },

  // Bone
  { key: 'boneMassKg',             label: 'Bone mass',           unit: 'kg', group: 'bone', source: 'raw',     description: 'Estimated weight of bone mineral content' },
  { key: 'mineralMassKg',          label: 'Mineral mass',        unit: 'kg', group: 'bone', source: 'raw',     description: 'Total mineral content including bone and electrolytes' },

  // Protein
  { key: 'proteinRatioPct',        label: 'Protein ratio',       unit: '%',  group: 'protein', source: 'raw',     description: 'Protein as a percentage of total body weight' },
  { key: 'proteinMassKg',          label: 'Protein mass',        unit: 'kg', group: 'protein', source: 'raw',     description: 'Total protein stored in muscle and tissue' },

  // Metabolism
  { key: 'bmrKcal',                label: 'BMR',                 unit: 'kcal', group: 'metabolism', source: 'raw',     description: 'Calories burned at complete rest to sustain life' },
  { key: 'tdee',                   label: 'TDEE',                unit: 'kcal', group: 'metabolism', source: 'derived', description: 'Total calories burned per day including activity' },
  { key: 'maintenanceKcal',        label: 'Maintenance',         unit: 'kcal', group: 'metabolism', source: 'derived', description: 'Calories needed daily to maintain current weight' },
  { key: 'fatLossKcal',            label: 'Fat loss target',     unit: 'kcal', group: 'metabolism', source: 'derived', description: 'Calorie target for steady fat loss (deficit from TDEE)' },
  { key: 'muscleGainKcal',         label: 'Muscle gain target',  unit: 'kcal', group: 'metabolism', source: 'derived', description: 'Calorie target for muscle building (surplus from TDEE)' },
  { key: 'metabolicEfficiencyScore', label: 'Metabolic efficiency', unit: '', group: 'metabolism', source: 'derived', description: 'How efficiently your metabolism runs for your body size' },

  // Health
  { key: 'healthScore',            label: 'Health score',        unit: '',   group: 'health', source: 'raw',     description: 'Overall health score calculated by the scale (0–100)' },
  { key: 'bodyAge',                label: 'Body age',            unit: 'yrs',group: 'health', source: 'raw',     description: 'Biological age estimated by the scale from body composition' },
  { key: 'fitnessAge',             label: 'Fitness age',         unit: 'yrs',group: 'health', source: 'derived', description: 'Age equivalent based on fat % and fitness score' },
  { key: 'overallFitnessScore',    label: 'Fitness score',       unit: '',   group: 'health', source: 'derived', description: 'Combined score from health, obesity risk, and muscle quality' },
  { key: 'obesityRiskScore',       label: 'Obesity risk',        unit: '',   group: 'health', source: 'derived', description: 'Risk score based on BMI, visceral fat, and body fat %' },
  { key: 'cardiometabolicRiskScore', label: 'Cardiometabolic risk', unit: '', group: 'health', source: 'derived', description: 'Estimated risk for heart and metabolic disease' },
  { key: 'boneHealthScore',        label: 'Bone health',         unit: '',   group: 'health', source: 'derived', description: 'Bone density quality relative to body weight and sex' },
  { key: 'hydrationScore',         label: 'Hydration score',     unit: '',   group: 'health', source: 'derived', description: 'How close your hydration is to the ideal range for your sex' },
  { key: 'proteinAdequacyScore',   label: 'Protein adequacy',    unit: '',   group: 'health', source: 'derived', description: 'Protein stores relative to body weight — reflects diet quality' },
  { key: 'muscleQualityScore',     label: 'Muscle quality',      unit: '',   group: 'health', source: 'derived', description: 'Muscle density score derived from FFMI and sex norms' },
  { key: 'metabolicAgeDelta',      label: 'Metabolic age Δ',     unit: 'yrs',group: 'health', source: 'derived', description: 'How many years older/younger your metabolism is vs your actual age' },
  { key: 'weightControlKg',        label: 'Weight control',      unit: 'kg', group: 'health', source: 'raw',     description: 'Suggested weight change recommended by the scale' },

  // Advanced
  { key: 'ffmi',               label: 'FFMI',                unit: '',   group: 'advanced', source: 'derived', description: 'Fat-Free Mass Index — muscle mass relative to height, like BMI for muscle' },
  { key: 'fmi',                label: 'FMI',                 unit: '',   group: 'advanced', source: 'derived', description: 'Fat Mass Index — fat mass relative to height squared' },
  { key: 'asmi',               label: 'ASMI',                unit: '',   group: 'advanced', source: 'derived', description: 'Appendicular Skeletal Muscle Index — limb muscle relative to height' },
  { key: 'leanToFatRatio',     label: 'Lean-to-fat ratio',   unit: '',   group: 'advanced', source: 'derived', description: 'How much lean mass you have for every kg of fat' },
  { key: 'skeletalMuscleToFatRatio', label: 'SMM-to-fat ratio', unit: '', group: 'advanced', source: 'derived', description: 'Skeletal muscle relative to fat mass — higher is better' },
  { key: 'muscleFatRatio',     label: 'Muscle-to-fat ratio', unit: '',   group: 'advanced', source: 'derived', description: 'Total muscle relative to fat — a key body composition indicator' },
  { key: 'leanMassPct',        label: 'Lean mass %',         unit: '%',  group: 'advanced', source: 'derived', description: 'Lean tissue as a percentage of total body weight' },
  { key: 'fatDistributionScore', label: 'Fat distribution',  unit: '',   group: 'advanced', source: 'derived', description: 'Balance of visceral vs subcutaneous fat — lower visceral is better' },

  // Goals
  { key: 'targetFatMassKg',     label: 'Target fat mass',    unit: 'kg', group: 'goals', source: 'derived', description: 'Fat mass you would have at your target weight and body fat %' },
  { key: 'targetLeanMassKg',    label: 'Target lean mass',   unit: 'kg', group: 'goals', source: 'derived', description: 'Lean mass you would have at your target weight and body fat %' },
  { key: 'estimatedDaysToGoal', label: 'Days to goal',       unit: 'd',  group: 'goals', source: 'derived', description: 'Estimated days to reach target weight at your current weekly rate' },
  { key: 'weeklyRecommendedKg', label: 'Weekly target',      unit: 'kg', group: 'goals', source: 'derived', description: 'Recommended weekly weight change rate based on your goal' },
];

export const GROUP_LABELS: Record<MetricGroupKey, string> = {
  measurements: 'Measurements',
  fat:          'Fat',
  muscle:       'Muscle',
  lean:         'Lean tissue',
  water:        'Water',
  bone:         'Bone & minerals',
  protein:      'Protein',
  metabolism:   'Metabolism',
  health:       'Health assessment',
  advanced:     'Advanced',
  goals:        'Goals',
};

export const GROUP_ORDER: MetricGroupKey[] = [
  'measurements', 'fat', 'muscle', 'lean', 'water', 'bone', 'protein',
  'metabolism', 'health', 'advanced', 'goals',
];
