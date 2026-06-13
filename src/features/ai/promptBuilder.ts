import type { Measurement, User } from '@/shared/db/types';

export interface AIMessage {
  role: 'system' | 'user';
  content: string;
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

export function buildInsightMessages(
  measurement: Measurement,
  user: User,
): AIMessage[] {
  const { raw, derived } = measurement;
  const age = ageFromDob(user.dob);

  const metricsPayload = {
    user: {
      age,
      sex:            user.sex,
      heightCm:       user.heightCm,
      activityLevel:  user.activityLevel,
      targetWeightKg: user.targetWeightKg,
    },
    raw: {
      weight:               `${raw.weightKg} kg`,
      standardWeight:       `${raw.standardWeightKg} kg`,
      bmi:                  raw.bmi,
      bmr:                  `${raw.bmrKcal} kcal/day`,
      heartRate:            `${raw.heartRateBpm} bpm`,
      waterRatio:           `${raw.waterRatioPct}%`,
      totalBodyWater:       `${raw.totalBodyWaterKg} kg`,
      boneMass:             `${raw.boneMassKg} kg`,
      muscleMass:           `${raw.muscleMassKg} kg`,
      muscleRatio:          `${raw.muscleRatioPct}%`,
      skeletalMuscleMass:   `${raw.skeletalMuscleMassKg} kg`,
      skeletalMuscleRatio:  `${raw.skeletalMuscleRatioPct}%`,
      fatRatio:             `${raw.fatRatioPct}%`,
      fatMass:              `${raw.fatMassKg} kg`,
      visceralFat:          `level ${raw.visceralFatLevel}`,
      subcutaneousFatRatio: `${raw.subcutaneousFatRatioPct}%`,
      subcutaneousFatMass:  `${raw.subcutaneousFatMassKg} kg`,
      leanBodyMass:         `${raw.leanBodyMassKg} kg`,
      proteinRatio:         `${raw.proteinRatioPct}%`,
      proteinMass:          `${raw.proteinMassKg} kg`,
      mineralMass:          `${raw.mineralMassKg} kg`,
      bodyType:             raw.bodyType,
      bodyAge:              raw.bodyAge,
      healthScore:          raw.healthScore,
      healthEvaluation:     raw.healthEvaluation,
      weightControl:        `${raw.weightControlKg} kg`,
    },
    derived: {
      ffmi:              derived.ffmi.toFixed(1),
      asmi:              derived.asmi.toFixed(1),
      muscleFatRatio:    derived.muscleFatRatio.toFixed(2),
      obesityClass:      derived.obesityClass,
      hydrationCategory: derived.hydrationCategory,
      tdee:              `${derived.tdee} kcal/day`,
      idealWeightRange:  `${derived.idealWeightRangeKg.low}–${derived.idealWeightRangeKg.high} kg`,
      bodyFatCategory:   derived.bodyFatCategory,
    },
  };

  return [
    {
      role: 'system',
      content:
        'You are a body composition analyst. Analyse the following biometric data and give specific, ' +
        'number-referenced observations. Avoid generic health advice. Be concise. ' +
        'Respond in exactly this JSON format:\n' +
        '{\n' +
        '  "summary": "2–3 sentence overview",\n' +
        '  "highlights": ["observation 1 with numbers", "observation 2", "observation 3"],\n' +
        '  "recommendations": ["actionable item 1", "actionable item 2", "actionable item 3"]\n' +
        '}',
    },
    {
      role: 'user',
      content: JSON.stringify(metricsPayload, null, 2),
    },
  ];
}
