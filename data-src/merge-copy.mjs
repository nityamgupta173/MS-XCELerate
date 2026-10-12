// One-off helper: merge data-src/copy-patch.json into the copy files, then empty the patch.
import { readFileSync, writeFileSync } from 'node:fs';

const patch = JSON.parse(readFileSync('data-src/copy-patch.json', 'utf8'));
for (const lang of ['en', 'hi']) {
  const file = `src/data/copy.${lang}.json`;
  const copy = JSON.parse(readFileSync(file, 'utf8'));
  Object.assign(copy, patch[lang] ?? {});
  writeFileSync(file, JSON.stringify(copy, null, 2) + '\n');
}
writeFileSync('data-src/copy-patch.json', JSON.stringify({ en: {}, hi: {} }, null, 2) + '\n');
console.log('copy merged');
