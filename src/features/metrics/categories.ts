export type MetricCategory =
  | 'overview'
  | 'fat'
  | 'muscle'
  | 'hydration'
  | 'bone'
  | 'metabolism'
  | 'cardiovascular';

export const CATEGORY_LABELS: Record<MetricCategory, string> = {
  overview:       'Overview',
  fat:            'Fat',
  muscle:         'Muscle & Lean',
  hydration:      'Hydration',
  bone:           'Bone & Minerals',
  metabolism:     'Metabolism',
  cardiovascular: 'Cardiovascular',
};

export const CATEGORY_ORDER: MetricCategory[] = [
  'overview', 'fat', 'muscle', 'hydration', 'bone', 'metabolism', 'cardiovascular',
];

export const METRIC_CATEGORY_MAP: Record<string, MetricCategory> = {
  weightKg:                'overview',
  standardWeightKg:        'overview',
  bmi:                     'overview',
  bodyType:                'overview',
  bodyAge:                 'overview',
  healthScore:             'overview',
  healthEvaluation:        'overview',
  weightControlKg:         'overview',
  obesityClass:            'overview',

  fatRatioPct:             'fat',
  fatMassKg:               'fat',
  visceralFatLevel:        'fat',
  subcutaneousFatRatioPct: 'fat',
  subcutaneousFatMassKg:   'fat',
  bodyFatCategory:         'fat',

  muscleMassKg:            'muscle',
  muscleRatioPct:          'muscle',
  skeletalMuscleMassKg:    'muscle',
  skeletalMuscleRatioPct:  'muscle',
  leanBodyMassKg:          'muscle',
  ffmi:                    'muscle',
  asmi:                    'muscle',
  muscleFatRatio:          'muscle',

  waterRatioPct:           'hydration',
  totalBodyWaterKg:        'hydration',
  hydrationCategory:       'hydration',

  boneMassKg:              'bone',
  mineralMassKg:           'bone',

  bmrKcal:                 'metabolism',
  tdee:                    'metabolism',
  proteinRatioPct:         'metabolism',
  proteinMassKg:           'metabolism',
  idealWeightRangeKg:      'metabolism',

  heartRateBpm:            'cardiovascular',
};
