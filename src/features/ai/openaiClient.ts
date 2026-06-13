import OpenAI from 'openai';
import type { AIMessage } from './promptBuilder';

export interface ParsedInsight {
  summary: string;
  highlights: string[];
  recommendations: string[];
}

export async function generateInsight(
  messages: AIMessage[],
  apiKey: string,
  model: string,
): Promise<ParsedInsight> {
  // dangerouslyAllowBrowser: key is user-supplied and stored locally — no server proxy in this client-only PWA
  const client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });

  const response = await client.chat.completions.create({
    model,
    messages,
    temperature:     0.3,
    max_tokens:      600,
    response_format: { type: 'json_object' },
  });

  const raw = response.choices[0]?.message?.content ?? '{}';

  try {
    const parsed = JSON.parse(raw) as Partial<ParsedInsight>;
    return {
      summary:         parsed.summary         ?? 'No summary available.',
      highlights:      parsed.highlights       ?? [],
      recommendations: parsed.recommendations  ?? [],
    };
  } catch {
    return {
      summary:         raw,
      highlights:      [],
      recommendations: [],
    };
  }
}
