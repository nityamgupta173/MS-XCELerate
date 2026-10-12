/**
 * No number may be typed into copy or JSX. Digits are only allowed inside template slots
 * ({f:...}, {n:...}, {c:...}) so that every figure on screen is a Fact, a Calc, a Sim or a Ui value.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { COPY, QA } from '../src/data';
import { literalText } from '../src/domain/template';

const DIGITS = /[0-9०-९]/;
/** Product names that contain a digit are names, not figures. */
const NAMES = /XL6/g;
const DIGIT = { test: (s: string) => DIGITS.test(s.replace(NAMES, '')) };
const errors: string[] = [];

for (const lang of ['en', 'hi'] as const) {
  for (const [key, tpl] of Object.entries(COPY[lang])) {
    if (DIGIT.test(literalText(tpl))) errors.push(`copy.${lang}.json "${key}": digit outside a slot`);
  }
}
for (const q of QA) {
  for (const lang of ['en', 'hi'] as const) {
    if (DIGIT.test(literalText(q.a[lang]))) errors.push(`qa "${q.id}" answer (${lang}): digit outside a slot`);
    if (q.chip && DIGIT.test(q.q[lang][0]!)) errors.push(`qa "${q.id}" chip question (${lang}): contains a digit`);
  }
}

// JSX text: anything between ">" and "<" on one line that is not an expression.
function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : p.endsWith('.tsx') ? [p] : [];
  });
}
for (const file of walk('src')) {
  readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
    if (line.trim().startsWith('//') || line.trim().startsWith('*')) return;
    for (const m of line.matchAll(/>([^<>{}]+)</g)) {
      const text = m[1]!;
      // Skip generics and comparisons that happen to sit between angle brackets in TypeScript.
      if (/[=;()]|=>/.test(text)) continue;
      if (DIGIT.test(text)) errors.push(`${file}:${i + 1}: digit in JSX text "${text.trim()}"`);
    }
  });
}

if (errors.length) {
  console.error(`Number lint failed (${errors.length}):\n` + errors.map((e) => `  - ${e}`).join('\n'));
  process.exit(1);
}
console.log('Number lint passed: no digits in copy, Q&A answers or JSX text outside slots.');
