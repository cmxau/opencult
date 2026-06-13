import type { Sex, ActivityLevel } from '@/shared/db/types';

// FFMI — Kouri et al. 1995, NSCA. Normal ♂17–22, ♀14–17
export function computeFFMI(lbmKg: number, heightM: number): number {
  if (heightM === 0) return 0;
  return lbmKg / (heightM * heightM);
}

// ASMI — Baumgartner et al. 1998, Am J Clin Nutr. Sarcopenia: ♂<7.26, ♀<5.45
export function computeASMI(skeletalMuscleMassKg: number, heightM: number): number {
  if (heightM === 0) return 0;
  return skeletalMuscleMassKg / (heightM * heightM);
}

// Muscle-to-Fat Ratio — Heymsfield et al. 2015. Optimal >1.0
export function computeMuscleFatRatio(muscleMassKg: number, fatMassKg: number): number {
  if (fatMassKg === 0) return 0;
  return muscleMassKg / fatMassKg;
}

// WHO BMI classification — WHO 2000
export function computeObesityClass(bmi: number): string {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25)   return 'Normal';
  if (bmi < 30)   return 'Overweight';
  if (bmi < 35)   return 'Obese Class I';
  if (bmi < 40)   return 'Obese Class II';
  return 'Obese Class III';
}

// ACSM 2013 body fat category by sex
export function computeBodyFatCategory(fatRatioPct: number, sex: Sex): string {
  if (sex === 'male') {
    if (fatRatioPct <= 5)  return 'Essential Fat';
    if (fatRatioPct <= 13) return 'Athlete';
    if (fatRatioPct <= 17) return 'Fitness';
    if (fatRatioPct <= 24) return 'Average';
    return 'Obese';
  }
  if (fatRatioPct <= 13) return 'Essential Fat';
  if (fatRatioPct <= 20) return 'Athlete';
  if (fatRatioPct <= 24) return 'Fitness';
  if (fatRatioPct <= 31) return 'Average';
  return 'Obese';
}

// EFSA 2010 hydration norms by sex
export function computeHydrationCategory(waterRatioPct: number, sex: Sex): string {
  if (sex === 'male') {
    if (waterRatioPct < 60)  return 'Low';
    if (waterRatioPct <= 65) return 'Optimal';
    return 'High';
  }
  if (waterRatioPct < 45)  return 'Low';
  if (waterRatioPct <= 60) return 'Optimal';
  return 'High';
}

const PAL: Record<ActivityLevel, number> = {
  sedentary:   1.2,
  light:       1.375,
  moderate:    1.55,
  active:      1.725,
  very_active: 1.9,
};

// TDEE — FAO/WHO/UNU 2001. BMR provided by scale directly.
export function computeTDEE(bmrKcal: number, activityLevel: ActivityLevel): number {
  return Math.round(bmrKcal * (PAL[activityLevel] ?? 1.2));
}

// Ideal weight range — Devine 1974, Robinson 1983, Hamwi 1964
export function computeIdealWeightRange(
  heightCm: number,
  sex: Sex,
): { low: number; high: number } {
  const heightIn = heightCm / 2.54;
  const excess   = Math.max(0, heightIn - 60);

  const weights =
    sex === 'male'
      ? [
          50   + 2.3  * excess,  // Devine
          52   + 1.9  * excess,  // Robinson
          48   + 2.7  * excess,  // Hamwi
        ]
      : [
          45.5 + 2.3  * excess,  // Devine
          49   + 1.7  * excess,  // Robinson
          45.4 + 2.3  * excess,  // Hamwi
        ];

  return {
    low:  Math.round(Math.min(...weights) * 10) / 10,
    high: Math.round(Math.max(...weights) * 10) / 10,
  };
}
