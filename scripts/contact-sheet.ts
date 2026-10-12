/** One PNG grid per screenshot folder, so a reviewer can scan every state at a glance. */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from '@playwright/test';

const sheets: Array<{ dir: string; out: string; cols: number; thumb: number }> = [
  { dir: 'screenshots/kiosk/nexa-en', out: 'screenshots/contact-kiosk-nexa-en.png', cols: 7, thumb: 300 },
  { dir: 'screenshots/kiosk/nexa-hi', out: 'screenshots/contact-kiosk-nexa-hi.png', cols: 7, thumb: 300 },
  { dir: 'screenshots/kiosk/arena-en', out: 'screenshots/contact-kiosk-arena-en.png', cols: 7, thumb: 300 },
  { dir: 'screenshots/kiosk/arena-hi', out: 'screenshots/contact-kiosk-arena-hi.png', cols: 7, thumb: 300 },
  { dir: 'screenshots/kiosk/other', out: 'screenshots/contact-kiosk-other.png', cols: 5, thumb: 300 },
  { dir: 'screenshots/other', out: 'screenshots/contact-phone-tablet-council.png', cols: 4, thumb: 460 },
  { dir: 'screenshots/demo', out: 'screenshots/contact-demo.png', cols: 3, thumb: 620 },
];

const browser = await chromium.launch();
for (const s of sheets) {
  if (!existsSync(s.dir)) continue;
  const files = readdirSync(s.dir).filter((f) => f.endsWith('.png')).sort();
  if (!files.length) continue;
  const cells = files.map((f) => {
    const data = readFileSync(join(s.dir, f)).toString('base64');
    return `<figure><img src="data:image/png;base64,${data}"><figcaption>${f.replace('.png', '')}</figcaption></figure>`;
  }).join('');
  const html = `<style>body{margin:0;padding:16px;background:#111;font:13px system-ui;color:#ddd}
    .g{display:grid;grid-template-columns:repeat(${s.cols},${s.thumb}px);gap:14px}figure{margin:0}
    img{width:${s.thumb}px;max-height:${s.thumb * 2.2}px;object-fit:cover;object-position:top;display:block;border:1px solid #333}figcaption{padding:4px 0}</style><div class="g">${cells}</div>`;
  const page = await browser.newPage({ viewport: { width: s.cols * (s.thumb + 14) + 32, height: 800 } });
  await page.setContent(html);
  await page.screenshot({ path: s.out, fullPage: true });
  await page.close();
  console.log(`wrote ${s.out} (${files.length} screens)`);
}
await browser.close();
