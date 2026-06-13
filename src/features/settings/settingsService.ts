import { db } from '@/shared/db';
import { DEFAULT_SETTINGS, type AppSettings } from '@/shared/db/types';

export async function getSettings(): Promise<AppSettings> {
  const existing = await db.settings.get(1);
  if (existing) return existing;
  await db.settings.put(DEFAULT_SETTINGS);
  return DEFAULT_SETTINGS;
}

export async function updateSettings(patch: Partial<Omit<AppSettings, 'id'>>): Promise<AppSettings> {
  const current = await getSettings();
  const updated  = { ...current, ...patch };
  await db.settings.put(updated);
  return updated;
}
