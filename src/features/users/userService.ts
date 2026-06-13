import { db } from '@/shared/db';
import type { User } from '@/shared/db/types';

export async function getUsers(): Promise<User[]> {
  return db.users.orderBy('createdAt').toArray();
}

export async function getUser(id: number): Promise<User | undefined> {
  return db.users.get(id);
}

export async function createUser(data: Omit<User, 'id' | 'createdAt'>): Promise<User> {
  const count = await db.users.count();
  if (count >= 10) throw new Error('Maximum 10 user profiles supported');
  const user: User = { ...data, createdAt: new Date().toISOString() };
  const id = await db.users.add(user);
  return { ...user, id: id as number };
}

export async function updateUser(id: number, patch: Partial<Omit<User, 'id'>>): Promise<void> {
  await db.users.update(id, patch);
}

export async function deleteUser(id: number): Promise<void> {
  await db.users.delete(id);
  await db.measurements.where('userId').equals(id).delete();
}

export const AVATAR_COLORS = [
  '#4ade80', '#60a5fa', '#f472b6', '#fbbf24',
  '#a78bfa', '#34d399', '#fb923c', '#e879f9',
  '#22d3ee', '#f87171',
];
