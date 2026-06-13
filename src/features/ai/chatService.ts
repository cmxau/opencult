import { db } from '@/shared/db';
import type { ChatThread, ChatMessage, ChatRole, User, Measurement } from '@/shared/db/types';
import OpenAI from 'openai';
import { METRIC_DEFS } from '@/features/metrics';

function ageFromDob(dob: string): number {
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  if (now.getMonth() < birth.getMonth() ||
      (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) age--;
  return age;
}

function summariseProfile(user: User): string {
  return `Profile: ${user.name}, ${user.sex}, age ${ageFromDob(user.dob)}, height ${user.heightCm}cm, target weight ${user.targetWeightKg}kg, activity ${user.activityLevel}.`;
}

function valueOf(m: Measurement, key: string): unknown {
  const raw     = m.raw     as unknown as Record<string, unknown>;
  const derived = m.derived as unknown as Record<string, unknown>;
  return raw[key] ?? derived[key];
}

function summariseMeasurements(measurements: Measurement[]): string {
  if (measurements.length === 0) return 'No measurements recorded yet.';

  const latest = measurements[0];
  const oldest = measurements[measurements.length - 1];
  const span   = Math.round((new Date(latest.timestamp).getTime() - new Date(oldest.timestamp).getTime()) / 86_400_000);

  const lines = [
    `Total measurements: ${measurements.length} over ~${span} days.`,
    `Latest (${new Date(latest.timestamp).toLocaleDateString()}):`,
  ];
  for (const def of METRIC_DEFS) {
    const v = valueOf(latest, def.key);
    if (typeof v === 'number') {
      lines.push(`  • ${def.label}: ${typeof v === 'number' ? v.toFixed(2) : v}${def.unit ? ' ' + def.unit : ''}`);
    } else if (typeof v === 'string') {
      lines.push(`  • ${def.label}: ${v}`);
    }
  }

  if (measurements.length > 1) {
    const w0 = oldest.raw.weightKg;
    const w1 = latest.raw.weightKg;
    const fat0 = oldest.raw.fatRatioPct;
    const fat1 = latest.raw.fatRatioPct;
    const muscle0 = oldest.raw.muscleMassKg;
    const muscle1 = latest.raw.muscleMassKg;
    lines.push('');
    lines.push(`Trends since ${new Date(oldest.timestamp).toLocaleDateString()}:`);
    lines.push(`  • Weight: ${w0.toFixed(1)} → ${w1.toFixed(1)} kg (${(w1 - w0).toFixed(1)} kg)`);
    lines.push(`  • Fat ratio: ${fat0.toFixed(1)}% → ${fat1.toFixed(1)}% (${(fat1 - fat0).toFixed(1)} pp)`);
    lines.push(`  • Muscle: ${muscle0.toFixed(1)} → ${muscle1.toFixed(1)} kg (${(muscle1 - muscle0).toFixed(1)} kg)`);
  }
  return lines.join('\n');
}

const SYSTEM_PROMPT = `You are a friendly, knowledgeable health-intelligence assistant for a smart-scale companion app called Open Cult.

You have access to the user's biometric profile and recent measurement history. Always reference specific numbers when you answer.

Guidelines:
- Be conversational, warm, encouraging.
- Cite specific metrics (e.g., "Your visceral fat level is 7 — that's in the healthy range").
- Suggest small, actionable next steps; avoid generic platitudes.
- When uncertain, say so. Recommend medical consultation when symptoms warrant.
- Format responses in concise paragraphs and use bullet points only when listing 3+ items.
- Use the same units the user uses (kg vs lbs, cm vs ft). Always show kg first if both possible.
- Don't repeat the user's whole data dump back — pick the relevant metrics.
- Maximum 4-6 sentences per answer unless the user asks for detail.`;

export async function listThreads(userId: number): Promise<ChatThread[]> {
  return (await db.chatThreads.where('userId').equals(userId).sortBy('updatedAt')).reverse();
}

export async function getMessages(threadId: number): Promise<ChatMessage[]> {
  return db.chatMessages.where('threadId').equals(threadId).sortBy('createdAt');
}

export async function createThread(userId: number, title = 'New chat'): Promise<ChatThread> {
  const now = new Date().toISOString();
  const t: ChatThread = { userId, title, createdAt: now, updatedAt: now };
  const id = await db.chatThreads.add(t);
  return { ...t, id: id as number };
}

export async function deleteThread(threadId: number): Promise<void> {
  await db.chatMessages.where('threadId').equals(threadId).delete();
  await db.chatThreads.delete(threadId);
}

export async function appendMessage(threadId: number, role: ChatRole, content: string): Promise<ChatMessage> {
  const m: ChatMessage = { threadId, role, content, createdAt: new Date().toISOString() };
  const id = await db.chatMessages.add(m);
  await db.chatThreads.update(threadId, { updatedAt: new Date().toISOString() });
  return { ...m, id: id as number };
}

export async function setThreadTitle(threadId: number, title: string): Promise<void> {
  await db.chatThreads.update(threadId, { title });
}

export interface SendOpts {
  threadId: number;
  userMessage: string;
  user: User;
  history: ChatMessage[];          // previous messages (without the new user msg)
  measurements: Measurement[];     // newest first
  apiKey: string;
  model: string;
}

export async function sendChat(opts: SendOpts): Promise<string> {
  const { user, history, measurements, apiKey, model, userMessage } = opts;
  // dangerouslyAllowBrowser: key is user-supplied and stored locally — no server proxy in this client-only PWA
  const client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });

  const contextBlock = [
    summariseProfile(user),
    '',
    summariseMeasurements(measurements.slice(0, 10)),
  ].join('\n');

  const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'system', content: `User context:\n${contextBlock}` },
  ];

  // Include the last ~20 messages for context, mapped to OpenAI roles
  for (const m of history.slice(-20)) {
    if (m.role === 'system') continue;
    messages.push({ role: m.role, content: m.content });
  }
  messages.push({ role: 'user', content: userMessage });

  const response = await client.chat.completions.create({
    model,
    messages,
    temperature: 0.5,
    max_tokens:  600,
  });
  return response.choices[0]?.message?.content?.trim() ?? '';
}
