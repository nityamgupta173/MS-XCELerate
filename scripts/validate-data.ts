/**
 * Build gate. Fails if: a fact lacks source / url-or-doc / retrieved / status (zod, on import);
 * anything references a fact id that does not exist; Hindi is missing a buyer-facing key.
 */
import { ALL_MODELS, COPY, FACTS, FACT_LIST, MPVS, QA } from '../src/data';
import { factIdsIn, parseTemplate, STAFF_PREFIXES } from '../src/domain/template';

const errors: string[] = [];
const need = (id: string | null | undefined, where: string) => {
  if (id && !FACTS.has(id)) errors.push(`${where}: unknown fact "${id}"`);
};

for (const m of ALL_MODELS) {
  Object.entries(m.facts).forEach(([k, id]) => need(id, `model ${m.id}.${k}`));
  for (const v of m.variants) Object.entries(v.facts).forEach(([k, id]) => need(id, `variant ${v.id}.${k}`));
}
MPVS.forEach((m) => need(m.seats, `mpv ${m.id}`));

for (const lang of ['en', 'hi'] as const) {
  for (const [key, tpl] of Object.entries(COPY[lang])) factIdsIn(tpl).forEach((id) => need(id, `copy.${lang} ${key}`));
}
for (const q of QA) {
  for (const lang of ['en', 'hi'] as const) {
    factIdsIn(q.a[lang]).forEach((id) => need(id, `qa ${q.id} (${lang})`));
    const ctx = (t: string) => parseTemplate(t).filter((x) => x.t === 'ctx').map((x) => (x as { name: string }).name).sort().join(',');
    if (ctx(q.a.en) !== ctx(q.a.hi)) errors.push(`qa ${q.id}: English and Hindi answers use different context slots`);
  }
  const fEn = factIdsIn(q.a.en).sort().join(',');
  const fHi = factIdsIn(q.a.hi).sort().join(',');
  if (fEn !== fHi) errors.push(`qa ${q.id}: English and Hindi answers cite different facts`);
}

const buyerKeys = Object.keys(COPY.en).filter((k) => !STAFF_PREFIXES.some((p) => k.startsWith(p)));
for (const k of buyerKeys) if (!(k in COPY.hi)) errors.push(`copy.hi: missing "${k}"`);
for (const k of Object.keys(COPY.hi)) if (!(k in COPY.en)) errors.push(`copy.en: missing "${k}"`);
for (const k of buyerKeys) {
  const a = factIdsIn(COPY.en[k]!).sort().join(',');
  const b = factIdsIn(COPY.hi[k] ?? '').sort().join(',');
  if (k in COPY.hi && a !== b) errors.push(`copy ${k}: English and Hindi cite different facts`);
}

if (errors.length) {
  console.error(`Data check failed (${errors.length}):\n` + errors.map((e) => `  - ${e}`).join('\n'));
  process.exit(1);
}
const gaps = FACT_LIST.filter((f) => f.status === 'needs-verification').length;
console.log(`Data check passed: ${FACT_LIST.length} facts (${gaps} need verification), ${QA.length} Q&A intents, ${buyerKeys.length} buyer-facing strings in two languages.`);
