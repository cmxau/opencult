import Dexie, { Table } from 'dexie';
import type {
  User, Measurement, Device, AppSettings, AIInsight,
  ChatMessage, ChatThread,
} from './types';

class OpenCultDB extends Dexie {
  users!:         Table<User>;
  measurements!:  Table<Measurement>;
  devices!:       Table<Device>;
  settings!:      Table<AppSettings>;
  aiInsights!:    Table<AIInsight>;
  chatThreads!:   Table<ChatThread>;
  chatMessages!:  Table<ChatMessage>;

  constructor() {
    super('OpenCultDB');

    this.version(1).stores({
      users:        '++id, createdAt',
      measurements: '++id, userId, timestamp',
      devices:      '++id, macAddress',
      settings:     'id',
      aiInsights:   '++id, measurementId, createdAt',
    });

    this.version(2).stores({
      users:        '++id, createdAt',
      measurements: '++id, userId, timestamp',
      devices:      '++id, macAddress',
      settings:     'id',
      aiInsights:   '++id, measurementId, createdAt',
      chatThreads:  '++id, userId, updatedAt',
      chatMessages: '++id, threadId, createdAt',
    }).upgrade(async tx => {
      // Migrate old settings to new shape
      await tx.table('settings').toCollection().modify((s: Record<string, unknown>) => {
        if (s.units === 'metric' || s.units === undefined) {
          s.weightUnit = 'kg';
          s.heightUnit = 'cm';
        } else if (s.units === 'imperial') {
          s.weightUnit = 'lbs';
          s.heightUnit = 'ft';
        }
        delete s.units;
        if (!s.theme) s.theme = 'system';
      });
    });

    // v3: backfill missing derived metric fields on existing measurements
    this.version(3).stores({
      users:        '++id, createdAt',
      measurements: '++id, userId, timestamp',
      devices:      '++id, macAddress',
      settings:     'id',
      aiInsights:   '++id, measurementId, createdAt',
      chatThreads:  '++id, userId, updatedAt',
      chatMessages: '++id, threadId, createdAt',
    }).upgrade(async tx => {
      // Dynamic import to avoid circular load when Dexie evaluates at module init
      const { computeDerivedMetrics } = await import('@/features/metrics');
      const users = await tx.table('users').toArray() as User[];
      const userById = new Map<number, User>(users.filter(u => u.id !== undefined).map(u => [u.id!, u]));

      await tx.table('measurements').toCollection().modify((m: Measurement) => {
        const user = userById.get(m.userId);
        if (!user) {
          // No matching user — fill with safe zero placeholders so type stays valid
          m.derived = {
            ffmi: 0, fmi: 0, asmi: 0,
            leanToFatRatio: 0, skeletalMuscleToFatRatio: 0, muscleFatRatio: 0,
            leanMassPct: 0, fatDistributionScore: 0,
            obesityClass: '', hydrationCategory: '', bodyFatCategory: '',
            tdee: 0, maintenanceKcal: 0, fatLossKcal: 0, muscleGainKcal: 0,
            metabolicEfficiencyScore: 0, metabolicAgeDelta: 0,
            fitnessAge: 0, overallFitnessScore: 0,
            obesityRiskScore: 0, cardiometabolicRiskScore: 0,
            boneHealthScore: 0, hydrationScore: 0,
            proteinAdequacyScore: 0, muscleQualityScore: 0,
            idealWeightRangeKg: { low: 0, high: 0 },
            targetFatMassKg: 0, targetLeanMassKg: 0,
            estimatedDaysToGoal: -1, weeklyRecommendedKg: 0,
          };
          return;
        }
        m.derived = computeDerivedMetrics(m.raw, user);
      });

      // Backfill targetWeightKg defaults on users if missing/0
      await tx.table('users').toCollection().modify((u: User) => {
        if (!u.targetWeightKg || u.targetWeightKg <= 0) {
          // Pick a sane default — current weight if available, else 70
          u.targetWeightKg = 70;
        }
      });
    });

    // v4: add showAdvancedMetrics to settings
    this.version(4).stores({
      users:        '++id, createdAt',
      measurements: '++id, userId, timestamp',
      devices:      '++id, macAddress',
      settings:     'id',
      aiInsights:   '++id, measurementId, createdAt',
      chatThreads:  '++id, userId, updatedAt',
      chatMessages: '++id, threadId, createdAt',
    }).upgrade(async tx => {
      await tx.table('settings').toCollection().modify((s: Record<string, unknown>) => {
        if (s.showAdvancedMetrics === undefined) {
          s.showAdvancedMetrics = false;
        }
      });
    });
  }
}

export const db = new OpenCultDB();
