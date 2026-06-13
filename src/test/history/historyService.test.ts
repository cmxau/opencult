import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/shared/db';
import {
  saveMeasurement,
  getMeasurementsForUser,
  getLatestMeasurementForUser,
  deleteMeasurement,
} from '@/features/history/historyService';
import type { Measurement } from '@/shared/db/types';

const MOCK_RAW: Measurement['raw'] = {
  weightKg: 75, standardWeightKg: 72, bmi: 23.1, bmrKcal: 1800,
  heartRateBpm: 72, waterRatioPct: 60, totalBodyWaterKg: 45,
  boneMassKg: 2.8, muscleMassKg: 35, muscleRatioPct: 46,
  skeletalMuscleMassKg: 28, skeletalMuscleRatioPct: 37,
  fatRatioPct: 18, fatMassKg: 13.5, visceralFatLevel: 5,
  subcutaneousFatRatioPct: 14, subcutaneousFatMassKg: 10.5,
  leanBodyMassKg: 61.5, proteinRatioPct: 16, proteinMassKg: 12,
  mineralMassKg: 3.2, bodyType: 'Athletic', bodyAge: 28,
  healthScore: 85, healthEvaluation: 'Good', weightControlKg: -3,
};

const MOCK_DERIVED: Measurement['derived'] = {
  ffmi: 20.1, fmi: 4.4, asmi: 9.2,
  leanToFatRatio: 4.6, skeletalMuscleToFatRatio: 2.1, muscleFatRatio: 2.6,
  leanMassPct: 82, fatDistributionScore: 35,
  obesityClass: 'Normal', hydrationCategory: 'Optimal', bodyFatCategory: 'Fitness',
  tdee: 2790, maintenanceKcal: 2790, fatLossKcal: 2290, muscleGainKcal: 3090,
  metabolicEfficiencyScore: 75, metabolicAgeDelta: -2,
  fitnessAge: 26, overallFitnessScore: 78,
  obesityRiskScore: 20, cardiometabolicRiskScore: 18,
  boneHealthScore: 80, hydrationScore: 88,
  proteinAdequacyScore: 70, muscleQualityScore: 72,
  idealWeightRangeKg: { low: 68, high: 74 },
  targetFatMassKg: 11, targetLeanMassKg: 60,
  estimatedDaysToGoal: 90, weeklyRecommendedKg: -0.4,
};

beforeEach(async () => {
  await db.measurements.clear();
  await db.aiInsights.clear();
});

describe('saveMeasurement', () => {
  it('saves and returns measurement with id', async () => {
    const m = await saveMeasurement(1, MOCK_RAW, MOCK_DERIVED, null);
    expect(m.id).toBeDefined();
    expect(m.userId).toBe(1);
    expect(m.raw.weightKg).toBe(75);
  });
});

describe('getMeasurementsForUser', () => {
  it('returns measurements for user sorted newest first', async () => {
    await saveMeasurement(1, MOCK_RAW, MOCK_DERIVED, null);
    await new Promise(r => setTimeout(r, 10));
    await saveMeasurement(1, { ...MOCK_RAW, weightKg: 74 }, MOCK_DERIVED, null);
    const results = await getMeasurementsForUser(1);
    expect(results).toHaveLength(2);
    expect(results[0].raw.weightKg).toBe(74);
  });

  it('returns empty for unknown user', async () => {
    const results = await getMeasurementsForUser(999);
    expect(results).toHaveLength(0);
  });
});

describe('getLatestMeasurementForUser', () => {
  it('returns the most recent measurement', async () => {
    await saveMeasurement(1, MOCK_RAW, MOCK_DERIVED, null);
    await new Promise(r => setTimeout(r, 10));
    await saveMeasurement(1, { ...MOCK_RAW, weightKg: 74 }, MOCK_DERIVED, null);
    const latest = await getLatestMeasurementForUser(1);
    expect(latest?.raw.weightKg).toBe(74);
  });

  it('returns null when no measurements', async () => {
    const latest = await getLatestMeasurementForUser(1);
    expect(latest).toBeNull();
  });
});

describe('deleteMeasurement', () => {
  it('removes the measurement', async () => {
    const m = await saveMeasurement(1, MOCK_RAW, MOCK_DERIVED, null);
    await deleteMeasurement(m.id!);
    const results = await getMeasurementsForUser(1);
    expect(results).toHaveLength(0);
  });
});
