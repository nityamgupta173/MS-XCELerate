import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';

export const tid = (page: Page, id: string) => page.getByTestId(id).first();
export const step = (page: Page) => page.locator('.kiosk-root').getAttribute('data-step');
export const expectStep = (page: Page, s: string) => expect(page.locator('.kiosk-root')).toHaveAttribute('data-step', s);

export interface Persona {
  channel: 'nexa' | 'arena' | 'pod';
  lang: 'en' | 'hi';
  rivals: string[];
  budget: string;
  km: string;
  pris: string[];
  riders: string;
  fuel: string;
  age: string;
}
export const UPGRADER: Persona = { channel: 'nexa', lang: 'en', rivals: ['hy', 'sel'], budget: 'b18_22', km: 'k2500', pris: ['resale', 'design'], riders: 'few', fuel: 'hybrid', age: 'a35_44' };
export const FAMILY: Persona = { channel: 'arena', lang: 'hi', rivals: ['nx'], budget: 'b10_14', km: 'k1500', pris: ['safety', 'running'], riders: 'family', fuel: 'cng', age: 'skip' };
export const STYLIST: Persona = { channel: 'nexa', lang: 'en', rivals: ['notsure'], budget: 'u10', km: 'k1500', pris: ['design', 'running'], riders: 'few', fuel: 'cng', age: 'u25' };

/** Collects console errors and warnings so a test can assert the console stayed clean. */
export function watchConsole(page: Page): string[] {
  const out: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') out.push(`${m.type()}: ${m.text()}`); });
  page.on('pageerror', (e) => out.push(`pageerror: ${e.message}`));
  return out;
}

/** Walks from the attract screen to the match screen, calling `shot` at each state. */
export async function toMatch(page: Page, p: Persona, shot: (name: string) => Promise<void> = async () => {}, query = '') {
  await page.goto(`/kiosk?channel=${p.channel}${query}`);
  await expectStep(page, 'attract');
  await shot('01-attract');
  await tid(page, 'start').click();
  await expectStep(page, 'language');
  await shot('02-language');
  await tid(page, `lang-${p.lang}`).click();
  await expectStep(page, 'shortlist');
  for (const r of p.rivals) await tid(page, `rival-${r}`).click();
  await shot('03-shortlist');
  await tid(page, 'next').click();
  await expectStep(page, 'needs');
  await shot('04-needs-budget');
  await tid(page, `budget-${p.budget}`).click();
  await shot('05-needs-km');
  await tid(page, `km-${p.km}`).click();
  for (const pr of p.pris) await tid(page, `pri-${pr}`).click();
  await shot('06-needs-priorities');
  await tid(page, 'next').click();
  await shot('07-needs-riders');
  await tid(page, `riders-${p.riders}`).click();
  await shot('08-needs-fuel');
  await tid(page, `fuel-${p.fuel}`).click();
  await shot('09-needs-age');
  await tid(page, `age-${p.age}`).click();
  await expectStep(page, 'match');
  await shot('10-match');
}

/** Every digit on screen must sit inside a Fact, Calc, Sim, Ui or Verify wrapper. Returns the offenders. */
export async function untracedNumbers(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const bad: string[] = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const text = (n.textContent ?? '').replace(/XL6/g, '');
      if (!/[0-9०-९]/.test(text)) continue;
      const el = n.parentElement;
      if (!el || el.closest('script, style, noscript')) continue;
      if (el.closest('[data-fact], [data-calc], [data-sim], [data-ui], [data-verify]')) continue;
      bad.push(text.trim().slice(0, 80));
    }
    return bad;
  });
}

/** Primary controls must sit in the reach zone (y >= 770 on the 1920 canvas) and be at least 96 px tall. */
export async function reachProblems(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const stage = document.querySelector<HTMLElement>('.stage');
    const scale = Number(stage?.dataset.scale ?? 1);
    const origin = stage!.getBoundingClientRect();
    const out: string[] = [];
    const controls = document.querySelectorAll<HTMLElement>('.kmain button, .kmain input, .hubtabs button, .kbar button');
    for (const el of controls) {
      if (el.closest('.pop') || el.matches('.fact, .chip, .key, [disabled]') || el.closest('.display')) continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0) continue;
      const y = (r.top - origin.top) / scale;
      const h = r.height / scale;
      const name = (el.textContent ?? el.getAttribute('aria-label') ?? el.tagName).trim().slice(0, 30);
      if (y < 769) out.push(`above reach zone (y=${Math.round(y)}): ${name}`);
      if (h < 95 && !el.matches('input[type=checkbox], input[type=range]')) out.push(`shorter than 96 px (${Math.round(h)}): ${name}`);
      if ((r.bottom - origin.top) / scale > 1921) out.push(`off the canvas: ${name}`);
    }
    // Nothing may be clipped below the bottom bar.
    const main = document.querySelector<HTMLElement>('.kmain');
    if (main && main.scrollHeight > main.clientHeight + 2) out.push(`content overflows the screen by ${main.scrollHeight - main.clientHeight} px`);
    const screen = document.querySelector<HTMLElement>('.screen');
    if (screen && main && screen.getBoundingClientRect().bottom > main.getBoundingClientRect().bottom + 2) out.push('screen is taller than its area');
    const reach = document.querySelector<HTMLElement>('.reach');
    if (reach && main) {
      const last = reach.lastElementChild as HTMLElement | null;
      if (last && last.getBoundingClientRect().bottom > main.getBoundingClientRect().bottom + 2) out.push(`reach content runs ${Math.round((last.getBoundingClientRect().bottom - main.getBoundingClientRect().bottom) / scale)} px past its area`);
    }
    return out;
  });
}

export async function axeProblems(page: Page): Promise<string[]> {
  const res = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  return res.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => `${v.id} (${v.impact}): ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`);
}
