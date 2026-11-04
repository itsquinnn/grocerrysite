import { NextRequest } from 'next/server';
import { z } from 'zod';
import { ok, err, handleOptions } from '@/lib/api';

// In-memory persistent cache for server runtime
const translationCache = new Map<string, string>();

// Seed with critical ecommerce terms
const SEED_TERMS: Record<string, string> = {
  'Baby Care': 'शिशु तथा बालबालिका स्याहार',
  'Pet Care': 'पाल्तु जनावरको स्याहार',
  'Frozen Foods': 'जमेका ताजा खानाहरू',
  'Instant Foods': 'तयारी खाजा तथा खाना',
  'Personal Hygiene': 'व्यक्तिगत सरसफाइ',
  'Household Essentials': 'घरेलु उपभोग्य सामग्री',
  'Beverages & Juices': 'पेय पदार्थ तथा जुस',
  'Organic Products': 'अर्ग्यानिक उत्पादनहरू',
  'Diapers & Wipes': 'डायपर तथा भाइब्स',
  'Cat Food': 'बिरालोको खाना',
  'Dog Food': 'कुकुरको खाना',
  'Fresh Meat & Fish': 'ताजा मासु तथा माछा',
  'Tea & Coffee': 'चिया तथा कफी',
  'Bath & Body': 'नुहाउने सामग्री',
};

for (const [k, v] of Object.entries(SEED_TERMS)) {
  translationCache.set(k.toLowerCase().trim(), v);
}

const TranslateSchema = z.object({
  text: z.string().optional(),
  texts: z.array(z.string()).optional(),
  source: z.string().default('en'),
  target: z.string().default('ne'),
});

async function fetchTranslation(text: string): Promise<string> {
  const clean = text.trim();
  const lower = clean.toLowerCase();

  if (translationCache.has(lower)) {
    return translationCache.get(lower)!;
  }

  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(clean)}&langpair=en|ne`;
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      const data = await res.json();
      const translated = data?.responseData?.translatedText;
      if (translated && typeof translated === 'string' && !translated.includes('MYMEMORY WARNING')) {
        translationCache.set(lower, translated);
        return translated;
      }
    }
  } catch (e) {
    console.warn(`[Translate API] translation lookup failed for "${clean}":`, e);
  }

  return clean;
}

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
      const translated = await fetchTranslation(text);
      return ok({ translation: translated, original: text });
    }

    if (texts && Array.isArray(texts)) {
      const results: Record<string, string> = {};
      await Promise.all(
        texts.map(async (t) => {
          results[t] = await fetchTranslation(t);
        })
      );
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

  const translated = await fetchTranslation(q);
  return ok({ translation: translated, original: q });
}

export async function OPTIONS() {
  return handleOptions();
}
