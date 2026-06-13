export type Sex            = 'male' | 'female';
export type ActivityLevel  = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type WeightUnit     = 'kg' | 'lbs';
export type HeightUnit     = 'cm' | 'ft';
export type ThemeMode      = 'light' | 'dark' | 'system';
export type OpenAIModel    = 'gpt-4o-mini' | 'gpt-4o';

export interface Goals {
  targetWeightKg:        number;
  targetBodyFatPct:      number;
  weeklyChangeRateKg:    number;   // − for fat loss, + for muscle gain
}

export interface User {
  id?: number;
  name: string;
  sex: Sex;
  dob: string;           // ISO date string
  heightCm: number;
  activityLevel: ActivityLevel;
  targetWeightKg: number;
  avatarColor: string;   // hex colour
  createdAt: string;
  goals?: Goals;
}

export interface RawMeasurement {
  weightKg: number;
  standardWeightKg: number;
  bmi: number;
  bmrKcal: number;
  heartRateBpm: number;
  waterRatioPct: number;
  totalBodyWaterKg: number;
  boneMassKg: number;
  muscleMassKg: number;
  muscleRatioPct: number;
  skeletalMuscleMassKg: number;
  skeletalMuscleRatioPct: number;
  fatRatioPct: number;
  fatMassKg: number;
  visceralFatLevel: number;
  subcutaneousFatRatioPct: number;
  subcutaneousFatMassKg: number;
  leanBodyMassKg: number;
  proteinRatioPct: number;
  proteinMassKg: number;
  mineralMassKg: number;
  bodyType: string;
  bodyAge: number;
  healthScore: number;
  healthEvaluation: string;
  weightControlKg: number;
}

export interface DerivedMetrics {
  /* Body composition indices */
  ffmi: number;
  fmi: number;
  asmi: number;
  leanToFatRatio: number;
  skeletalMuscleToFatRatio: number;
  muscleFatRatio: number;
  leanMassPct: number;
  fatDistributionScore: number;

  /* Categories / classifications */
  obesityClass: string;
  hydrationCategory: string;
  bodyFatCategory: string;

  /* Metabolism */
  tdee: number;
  maintenanceKcal: number;
  fatLossKcal: number;
  muscleGainKcal: number;
  metabolicEfficiencyScore: number;
  metabolicAgeDelta: number;

  /* Health scores (0–100) */
  fitnessAge: number;
  overallFitnessScore: number;
  obesityRiskScore: number;
  cardiometabolicRiskScore: number;
  boneHealthScore: number;
  hydrationScore: number;
  proteinAdequacyScore: number;
  muscleQualityScore: number;

  /* Targets */
  idealWeightRangeKg: { low: number; high: number };
  targetFatMassKg: number;
  targetLeanMassKg: number;
  estimatedDaysToGoal: number;
  weeklyRecommendedKg: number;
}

export interface Measurement {
  id?: number;
  userId: number;
  timestamp: string;
  raw: RawMeasurement;
  derived: DerivedMetrics;
  notes: string | null;
}

export interface Device {
  id?: number;
  macAddress: string;
  name: string;
  lastConnectedAt: string;
  batteryPct: number | null;
}

export interface AppSettings {
  id: 1;                          // always 1 — single row
  activeUserId: number | null;
  weightUnit: WeightUnit;
  heightUnit: HeightUnit;
  theme: ThemeMode;
  reminderEnabled: boolean;
  reminderDayOfWeek: number;      // 0 = Sunday
  reminderTimeHHMM: string;       // e.g. "08:00"
  openAIKey: string;
  openAIModel: OpenAIModel;
  autoExportEnabled: boolean;
  autoExportTime: string;         // e.g. "06:00"
  showAdvancedMetrics: boolean;
}

export interface AIInsight {
  id?: number;
  measurementId: number;
  prompt: string;
  response: string;
  model: string;
  createdAt: string;
}

/* Chat */
export type ChatRole = 'system' | 'user' | 'assistant';

export interface ChatMessage {
  id?: number;
  threadId: number;
  role: ChatRole;
  content: string;
  createdAt: string;
}

export interface ChatThread {
  id?: number;
  userId: number;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
  id: 1,
  activeUserId: null,
  weightUnit: 'kg',
  heightUnit: 'cm',
  theme: 'system',
  reminderEnabled: false,
  reminderDayOfWeek: 1,           // Monday
  reminderTimeHHMM: '08:00',
  openAIKey: '',
  openAIModel: 'gpt-4o-mini',
  autoExportEnabled: false,
  autoExportTime: '06:00',
  showAdvancedMetrics: false,
};
