import { NextRequest } from 'next/server';
import { z } from 'zod';
import { ok, err, handleOptions } from '@/lib/api';

const TranslateSchema = z.object({
  text: z.string().optional(),
  texts: z.array(z.string()).optional(),
  source: z.string().default('en'),
  target: z.string().default('en'),
});

export async function POST(req: NextRequest) {
  if (req.method === 'OPTIONS') return handleOptions();

  try {
    const body = await req.json();
    const parsed = TranslateSchema.safeParse(body);
    if (!parsed.success) {
      return err('Invalid translation request body', 400);
    }

    const { text, texts } = parsed.data;

    if (text) {
      return ok({ translation: text.trim(), original: text });
    }

    if (texts && Array.isArray(texts)) {
      const results: Record<string, string> = {};
      for (const t of texts) {
        results[t] = t.trim();
      }
      return ok({ translations: results });
    }

    return err('Missing text or texts in request body', 400);
  } catch (e: any) {
    return err(e?.message || 'Translation service error', 500);
  }
}

export async function GET(req: NextRequest) {
  if (req.method === 'OPTIONS') return handleOptions();
  const url = new URL(req.url);
  const q = url.searchParams.get('q');
  if (!q) return err('Missing q query parameter', 400);

  return ok({ translation: q.trim(), original: q });
}

export async function OPTIONS() {
  return handleOptions();
}
