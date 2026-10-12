import { mkdirSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { FAMILY, UPGRADER, tid, toMatch, type Persona } from './helpers';

/** Every kiosk state, in both skins and both languages, plus the other surfaces. Saved to /screenshots. */
const combos: Array<[string, Persona]> = [
  ['nexa-en', UPGRADER],
  ['nexa-hi', { ...UPGRADER, lang: 'hi' }],
  ['arena-en', { ...FAMILY, lang: 'en' }],
  ['arena-hi', FAMILY],
];

for (const [name, persona] of combos) {
  test(`screenshots: kiosk ${name}`, async ({ page }) => {
    const dir = `screenshots/kiosk/${name}`;
    mkdirSync(dir, { recursive: true });
    const shot = async (n: string) => { await page.waitForTimeout(350); await page.screenshot({ path: `${dir}/${n}.png` }); };
    await toMatch(page, persona, shot);
    await tid(page, 'see-compare').click();
    for (const g of ['running', 'basics', 'safety', 'ownership']) { await tid(page, `group-${g}`).click(); await shot(`11-compare-${g}`); }
    await tid(page, 'group-running').click();
    await tid(page, 'switch-ours').click();
    await shot('11-compare-variant-picker');
    await page.getByRole('button', { name: /Close|बंद करें/ }).click();
    await tid(page, 'next').click();
    await page.locator('.chipbtn').first().click();
    await shot('12-ask-answer');
    await tid(page, 'ask-input').click();
    await shot('12-ask-keyboard');
    await tid(page, 'next').click();
    await shot('13-costs');
    await page.locator('.screen-costs .fact.calc').first().click();
    await shot('13-costs-calc-popover');
    await page.getByRole('button', { name: /Close|बंद करें/ }).click();
    await tid(page, 'next').click();
    for (const t of ['promise', 'pledge', 'weekend']) { await tid(page, `tab-${t}`).click(); await shot(`14-promises-${t}`); }
    await tid(page, 'next').click();
    await shot('15-handoff');
    const back = () => page.getByRole('button', { name: /^(Back|पीछे)$/ }).click();
    await tid(page, 'ho-qr').click();
    await shot('16-handoff-qr');
    await back();
    await tid(page, 'ho-phone').click();
    for (const d of '9000000000') await tid(page, `digit-${d}`).click();
    await shot('17-handoff-phone-consent');
    await back();
    await tid(page, 'ho-book').click();
    await tid(page, 'slot-sat1').click();
    await tid(page, 'book').click();
    await shot('18-handoff-booked');
    await back();
    await tid(page, 'ho-talk').click();
    await shot('19-handoff-talk');
    await tid(page, 'finish').click();
    await shot('20-done');
  });
}

test('screenshots: kiosk idle overlay, no-fit and pod', async ({ page }) => {
  mkdirSync('screenshots/kiosk/other', { recursive: true });
  const shot = (n: string) => page.screenshot({ path: `screenshots/kiosk/other/${n}.png` });
  await toMatch(page, UPGRADER, undefined, '&idle=1&warn=30');
  await expect(tid(page, 'idle')).toBeVisible({ timeout: 5000 });
  await shot('idle-overlay');
  await toMatch(page, { ...UPGRADER, riders: 'many' });
  await shot('nofit-seven-seats');
  await toMatch(page, { ...UPGRADER, budget: 'u10' });
  await shot('nofit-budget');
  await toMatch(page, { ...UPGRADER, rivals: ['cr'], budget: 'b14_18', pris: ['safety', 'running'], riders: 'family' });
  await shot('cross-channel-match');
  await page.goto('/kiosk?channel=pod');
  await page.waitForTimeout(600);
  await shot('pod-attract');
});

async function seedSession(page: Page) {
  await toMatch(page, UPGRADER);
  await tid(page, 'see-compare').click();
  await tid(page, 'next').click();
  await tid(page, 'chip-warranty.toyota').click();
  await tid(page, 'ask-input').fill('can it tow a caravan');
  await tid(page, 'ask-send').click();
  for (let i = 0; i < 3; i++) await tid(page, 'next').click();
  await tid(page, 'ho-qr').click();
  const url = (await tid(page, 'qr').getAttribute('data-url'))!;
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await tid(page, 'ho-talk').click();
  return url;
}

test('screenshots: phone, tablet, council, about', async ({ context, page }) => {
  mkdirSync('screenshots/other', { recursive: true });
  const url = await seedSession(page);
  const p = await context.newPage();
  await p.setViewportSize({ width: 390, height: 844 });
  await p.goto(url);
  await p.waitForTimeout(400);
  await p.screenshot({ path: 'screenshots/other/phone-en.png', fullPage: true });
  await p.getByTestId('m-lang').click();
  await p.screenshot({ path: 'screenshots/other/phone-hi.png', fullPage: true });
  await p.goto('/m#broken');
  await p.screenshot({ path: 'screenshots/other/phone-error.png' });
  await p.setViewportSize({ width: 1180, height: 820 });
  await p.goto('/expert');
  await p.getByTestId('ex-card-live').click();
  await p.waitForTimeout(300);
  await p.screenshot({ path: 'screenshots/other/expert-live.png' });
  await p.getByTestId('ex-card-sample').nth(1).click();
  await p.screenshot({ path: 'screenshots/other/expert-sample.png' });
  await p.setViewportSize({ width: 1440, height: 900 });
  await p.goto('/council');
  await p.waitForTimeout(300);
  await p.screenshot({ path: 'screenshots/other/council.png', fullPage: true });
  await p.goto('/about');
  await p.locator('table.facts').waitFor();
  await p.screenshot({ path: 'screenshots/other/about.png' });
});

for (const [w, h] of [[1440, 900], [1920, 1080], [1366, 768]] as const) {
  test(`screenshots: judge mode at ${w} x ${h}`, async ({ page }) => {
    mkdirSync('screenshots/demo', { recursive: true });
    await page.setViewportSize({ width: w, height: h });
    await page.goto('/demo');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `screenshots/demo/demo-${w}x${h}-start.png` });
    await page.getByTestId('claim-4').click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `screenshots/demo/demo-${w}x${h}-claim4.png` });
    await page.getByTestId('claim-7').click();
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `screenshots/demo/demo-${w}x${h}-claim7.png` });
  });
}
