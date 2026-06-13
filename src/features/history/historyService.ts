import { db } from '@/shared/db';
import type { Measurement, RawMeasurement, DerivedMetrics } from '@/shared/db/types';

export async function saveMeasurement(
  userId: number,
  raw: RawMeasurement,
  derived: DerivedMetrics,
  notes: string | null,
): Promise<Measurement> {
  const measurement: Measurement = {
    userId,
    timestamp: new Date().toISOString(),
    raw,
    derived,
    notes,
  };
  const id = await db.measurements.add(measurement);
  return { ...measurement, id: id as number };
}

export async function getMeasurementsForUser(userId: number): Promise<Measurement[]> {
  const all = await db.measurements.where('userId').equals(userId).sortBy('timestamp');
  return all.reverse();
}

export async function getLatestMeasurementForUser(userId: number): Promise<Measurement | null> {
  const all = await getMeasurementsForUser(userId);
  return all[0] ?? null;
}

export async function getMeasurementsInRange(
  userId: number,
  from: Date,
  to: Date,
): Promise<Measurement[]> {
  const all = await getMeasurementsForUser(userId);
  return all.filter((m) => {
    const t = new Date(m.timestamp);
    return t >= from && t <= to;
  });
}

export async function deleteMeasurement(id: number): Promise<void> {
  await db.measurements.delete(id);
  await db.aiInsights.where('measurementId').equals(id).delete();
}

export async function exportAllData(): Promise<string> {
  const users        = await db.users.toArray();
  const measurements = await db.measurements.toArray();
  return JSON.stringify({ users, measurements, exportedAt: new Date().toISOString() }, null, 2);
}

export async function importAllData(json: string): Promise<void> {
  const data = JSON.parse(json) as { users?: unknown[]; measurements?: unknown[] };
  if (!Array.isArray(data.users) || !Array.isArray(data.measurements)) {
    throw new Error('Invalid backup file: missing users or measurements arrays.');
  }
  await db.transaction('rw', [db.users, db.measurements], async () => {
    await db.users.clear();
    await db.measurements.clear();
    for (const u of data.users!) await db.users.add(u as never);
    for (const m of data.measurements!) await db.measurements.add(m as never);
  });
}
