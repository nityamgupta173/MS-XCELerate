import Fuse from 'fuse.js';
import { QA, type Lang } from '../data';
import type { QaIntent } from '../data/schema';

export interface QaContext {
  modelId?: string | null;
  rivalId?: string | null;
}
export interface QaResult {
  intent: QaIntent | null;
  route: 'answer' | 'expert' | 'unanswered';
  confidence: number;
}

export function normalise(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFC')
    .replace(/[?!.,;:'"()\-–—/\\₹]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Things the kiosk must never answer itself. Checked before any fuzzy match. */
const GUARDS: Array<{ id: string; re: RegExp }> = [
  { id: 'guard.unlaunched', re: /(7 ?seater grand vitara|seven seater grand vitara|three row grand|3 row grand|y43|upcoming model|next gen|new launch coming|facelift coming|आने वाली|नई लॉन्च|naya model kab)/ },
  { id: 'guard.finance', re: /(\bemi\b|\bloan\b|interest rate|down ?payment|insurance claim|tax saving|legal|lawyer|doctor|medical|ईएमआई|लोन|ब्याज|किस्त|kist)/ },
  { id: 'price.offers', re: /(discount|\boffers?\b|on ?road|best price|final price|cash ?back|exchange bonus|\bdeal\b|negotiat|kitna kam|kam karo|छूट|ऑफर|ऑन ?रोड|डिस्काउंट|कैशबैक|एक्सचेंज बोनस|कितना कम)/ },
  { id: 'guard.rivalfaults', re: /((creta|seltos|hyryder|nexon|toyota|hyundai|kia|tata).*(problem|issue|fault|unreliable|breakdown|complaint|rumou?r|recall|खराबी|दिक्कत|शिकायत|kharabi|dikkat))|((problem|issue|fault|unreliable|breakdown|complaint|rumou?r|recall|खराबी|दिक्कत|शिकायत).*(creta|seltos|hyryder|nexon|toyota|hyundai|kia|tata))/ },
];

interface Entry {
  intent: QaIntent;
  text: string;
}
const entries: Entry[] = QA.flatMap((intent) => [...intent.q.en, ...intent.q.hi].map((q) => ({ intent, text: normalise(q) })));
const fuse = new Fuse(entries, { keys: ['text'], includeScore: true, threshold: 0.5, ignoreLocation: true, minMatchCharLength: 2 });
const byId = new Map(QA.map((i) => [i.id, i]));

export const ANSWER_THRESHOLD = 0.34;

export function ask(text: string, ctx: QaContext = {}): QaResult {
  const q = normalise(text);
  if (q.length < 3) return { intent: null, route: 'unanswered', confidence: 0 };
  for (const g of GUARDS) {
    if (g.re.test(q)) {
      const intent = byId.get(g.id) ?? null;
      return { intent, route: intent ? intent.route : 'unanswered', confidence: 1 };
    }
  }
  const exact = entries.find((e) => e.text === q);
  const hits = exact ? [{ item: exact, score: 0 }] : fuse.search(q, { limit: 8 });
  let best: { intent: QaIntent; score: number } | null = null;
  for (const h of hits) {
    let score = h.score ?? 1;
    const i = h.item.intent;
    const tagged = (i.models?.length ?? 0) + (i.rivals?.length ?? 0) > 0;
    const onContext = Boolean((ctx.modelId && i.models?.includes(ctx.modelId)) || (ctx.rivalId && i.rivals?.includes(ctx.rivalId)));
    if (onContext) score -= 0.06;
    else if (tagged && (ctx.modelId || ctx.rivalId)) score += 0.04;
    if (!best || score < best.score) best = { intent: i, score };
  }
  if (!best || best.score > ANSWER_THRESHOLD) return { intent: null, route: 'unanswered', confidence: best ? 1 - best.score : 0 };
  return { intent: best.intent, route: best.intent.route, confidence: 1 - Math.max(best.score, 0) };
}

/** Suggested-question chips for the current comparison: on-context intents first. */
export function suggestions(ctx: QaContext, lang: Lang, limit = 6): Array<{ id: string; q: string }> {
  const chips = QA.filter((i) => i.chip);
  const score = (i: QaIntent) => {
    const tagged = (i.models?.length ?? 0) + (i.rivals?.length ?? 0) > 0;
    if (!tagged) return 1;
    const modelOk = !i.models?.length || (ctx.modelId ? i.models.includes(ctx.modelId) : false);
    const rivalOk = !i.rivals?.length || (ctx.rivalId ? i.rivals.includes(ctx.rivalId) : false);
    return modelOk && rivalOk ? 2 : -1;
  };
  return chips
    .map((i) => ({ i, s: score(i) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map(({ i }) => ({ id: i.id, q: i.q[lang][0]! }));
}
export const intentById = (id: string) => byId.get(id) ?? null;
