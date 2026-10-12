import { expect, test } from '@playwright/test';
import { FAMILY, STYLIST, UPGRADER, axeProblems, expectStep, reachProblems, tid, toMatch, untracedNumbers, watchConsole } from './helpers';

test.describe('kiosk: three personas end to end', () => {
  test('Arrived Upgrader at NEXA: Grand Vitara hybrid, same-car evidence, booking, hand-off to a person', async ({ page }) => {
    const log = watchConsole(page);
    await toMatch(page, UPGRADER);
    await expect(page.locator('.screen-match .car-name').first()).toHaveText('Grand Vitara');
    await expect(tid(page, 'rivalnote-hy')).toBeVisible();
    await expect(tid(page, 'rivalnote-sel')).toContainText('crash rating');
    await tid(page, 'see-compare').click();
    await expectStep(page, 'compare');
    await expect(tid(page, 'rule')).toContainText('same type of engine');
    await expect(tid(page, 'honest-theirs')).toBeVisible();
    await tid(page, 'group-ownership').click();
    await expect(tid(page, 'twin')).toContainText('Bidadi');
    await expect(page.locator('[data-row="buyback"] [data-proposed]')).toBeVisible();
    await tid(page, 'next').click();
    await tid(page, 'chip-warranty.toyota').click();
    await expect(tid(page, 'answer')).toContainText('identical since');
    await tid(page, 'next').click();
    await expectStep(page, 'costs');
    await expect(tid(page, 'monthly-a')).toContainText('₹');
    await tid(page, 'next').click();
    await expect(tid(page, 'promise-promise')).toContainText('60%');
    await tid(page, 'promise-book').click();
    await tid(page, 'slot-sat1').click();
    await tid(page, 'book').click();
    await expect(tid(page, 'booked')).toBeVisible();
    await tid(page, 'finish').click();
    await expectStep(page, 'done');
    await expect(tid(page, 'done')).toContainText('Weekend Ownership');
    await tid(page, 'clear').click();
    await expectStep(page, 'attract');
    expect(log).toEqual([]);
  });

  test('First-SUV Family at Arena, in Hindi: Victoris CNG against the Nexon, Service Pledge, send to phone', async ({ page }) => {
    const log = watchConsole(page);
    await toMatch(page, FAMILY);
    await expect(page.locator('html')).toHaveAttribute('lang', 'hi');
    await expect(page.locator('.screen-match .car-name').first()).toHaveText('Victoris');
    await expect(page.locator('.screen-match .car-variant').first()).toHaveText('VXI CNG');
    await tid(page, 'see-compare').click();
    await tid(page, 'group-safety').click();
    await expect(page.locator('[data-row="crash"]')).toContainText('Bharat NCAP');
    await tid(page, 'next').click();
    await tid(page, 'chip-nexon.brezza.safety').click();
    await expect(tid(page, 'answer')).toHaveAttribute('data-intent', 'nexon.brezza.safety');
    await tid(page, 'next').click();
    await expect(tid(page, 'monthly-a')).toContainText('₹');
    await tid(page, 'next').click();
    await tid(page, 'tab-pledge').click();
    await expect(tid(page, 'promise-pledge')).toBeVisible();
    await tid(page, 'next').click();
    await expectStep(page, 'handoff');
    await tid(page, 'ho-phone').click();
    await expect(tid(page, 'consent')).toBeVisible();
    expect(log).toEqual([]);
  });

  test('Budget Stylist at NEXA: not sure yet, Fronx CNG, offers routed to the expert, QR with no number', async ({ page }) => {
    const log = watchConsole(page);
    await toMatch(page, STYLIST);
    await expect(page.locator('.screen-match .car-name').first()).toHaveText('Fronx');
    await expect(page.locator('.screen-match')).toContainText('ranks by trim level');
    await tid(page, 'see-compare').click();
    await expect(page.locator('.screen')).toContainText('Add a car to compare');
    await tid(page, 'next').click();
    await tid(page, 'chip-price.offers').click();
    await expect(tid(page, 'routed')).toBeVisible();
    await expect(tid(page, 'answer')).toContainText('set by your dealer');
    await tid(page, 'next').click();
    await tid(page, 'next').click();
    await tid(page, 'next').click();
    await tid(page, 'ho-qr').click();
    const url = await tid(page, 'qr').getAttribute('data-url');
    expect(url).toContain('/m#');
    expect(url).not.toMatch(/\d{10}/);
    await tid(page, 'qr-done').click();
    await expect(tid(page, 'done')).toContainText('Nothing about you was stored');
    expect(log).toEqual([]);
  });
});

test.describe('the recommendation is not rigged', () => {
  test('a NEXA kiosk recommends the Arena Victoris and books it with dual credit', async ({ page }) => {
    await toMatch(page, { ...UPGRADER, rivals: ['cr'], budget: 'b14_18', pris: ['safety', 'running'], riders: 'family' });
    await expect(page.locator('.screen-match .car-name').first()).toHaveText('Victoris');
    await expect(tid(page, 'cross')).toContainText('Arena');
    await expect(tid(page, 'cross').locator('[data-proposed]')).toBeVisible();
    await tid(page, 'book-from-match').click();
    await tid(page, 'slot-sat2').click();
    await tid(page, 'book').click();
    await expect(tid(page, 'booked')).toContainText('[NEAREST ARENA OUTLET]');
    await expect(tid(page, 'booked')).toContainText('credited too');
  });
  test('says plainly when a rival wins the first priority', async ({ page }) => {
    await toMatch(page, { ...UPGRADER, rivals: ['cr'], pris: ['performance'], fuel: 'petrol' });
    await expect(tid(page, 'rival-wins')).toContainText('Creta is ahead of our best fit');
  });
  test('seven seats: no SUV fits, people-carriers suggested', async ({ page }) => {
    await toMatch(page, { ...UPGRADER, riders: 'many' });
    await expect(page.locator('.screen')).toContainText('None of our SUVs seats more than five');
    await expect(page.locator('.mpvs')).toContainText('Ertiga');
  });
  test('budget too low for the fuel: says so and states the gap', async ({ page }) => {
    await toMatch(page, { ...STYLIST, fuel: 'hybrid' });
    await expect(page.locator('.screen-match')).toContainText('Nothing fits that budget with that fuel');
    await expect(page.locator('.screen-match [data-calc="budget.gap"]')).toBeVisible();
  });
});

test.describe('kiosk rules', () => {
  test('idle: warns, counts down, wipes the session and says so', async ({ page }) => {
    await toMatch(page, UPGRADER, undefined, '&idle=2&warn=2');
    const session = await page.locator('.kiosk-root').getAttribute('data-session');
    await expect(tid(page, 'idle')).toBeVisible({ timeout: 6000 });
    await expect(tid(page, 'idle')).toContainText('Still there?');
    await expectStep(page, 'attract');
    await expect(tid(page, 'wiped')).toHaveText('We cleared this screen for your privacy.');
    expect(await page.locator('.kiosk-root').getAttribute('data-session')).not.toBe(session);
    await tid(page, 'start').click();
    await tid(page, 'lang-en').click();
    await expect(page.locator('.opt.is-on')).toHaveCount(0);
  });
  test('idle: "Yes, continue" keeps the session', async ({ page }) => {
    await toMatch(page, UPGRADER, undefined, '&idle=2&warn=8');
    await expect(tid(page, 'idle')).toBeVisible({ timeout: 6000 });
    await page.getByRole('button', { name: 'Yes, continue' }).click();
    await expectStep(page, 'match');
    await expect(page.locator('.screen-match .car-name').first()).toHaveText('Grand Vitara');
  });
  test('the done screen wipes itself', async ({ page }) => {
    await toMatch(page, STYLIST, undefined, '&done=2');
    await tid(page, 'book-from-match').click();
    await tid(page, 'slot-wk').click();
    await tid(page, 'book').click();
    await tid(page, 'finish').click();
    await expectStep(page, 'done');
    await expectStep(page, 'attract');
  });
  test('language switches mid-flow and keeps the state', async ({ page }) => {
    await toMatch(page, UPGRADER);
    await tid(page, 'see-compare').click();
    await expect(page.locator('.honest h2')).toHaveText('The honest read');
    await tid(page, 'lang').click();
    await expectStep(page, 'compare');
    await expect(page.locator('.honest h2')).toHaveText('सीधी बात');
    await expect(page.locator('.versus .car-name').first()).toHaveText('Grand Vitara');
    await tid(page, 'lang').click();
    await expect(page.locator('.honest h2')).toHaveText('The honest read');
  });
  test('start over is always reachable and clears everything', async ({ page }) => {
    await toMatch(page, FAMILY);
    await tid(page, 'startover').click();
    await expectStep(page, 'attract');
  });
  test('typed questions: answered, routed or honestly unanswered', async ({ page }) => {
    await toMatch(page, UPGRADER);
    await tid(page, 'see-compare').click();
    await tid(page, 'next').click();
    const askQ = async (q: string) => { await tid(page, 'ask-input').fill(q); await tid(page, 'ask-send').click(); };
    await askQ('do i need to plug it in');
    await expect(tid(page, 'answer')).toHaveAttribute('data-intent', 'hybrid.plug');
    await askQ('what is the best discount you can give');
    await expect(tid(page, 'routed')).toBeVisible();
    await askQ('can it tow a caravan');
    await expect(tid(page, 'answer-none')).toContainText("I don't have a checked answer");
    await tid(page, 'ask-input').click();
    await expect(tid(page, 'keyboard')).toBeVisible();
  });
  test('no discount, offer or on-road quote appears on any kiosk screen', async ({ page }) => {
    const seen: string[] = [];
    await toMatch(page, UPGRADER, async () => { seen.push(await page.locator('.kmain').innerText()); });
    for (const next of ['see-compare', 'next', 'next', 'next', 'next']) { await tid(page, next).click(); seen.push(await page.locator('.kmain').innerText()); }
    const text = seen.join('\n').toLowerCase();
    expect(text).not.toMatch(/cash ?back|exchange bonus|on-road price of|special offer|save ₹/);
    expect(text.match(/discount/g)?.length ?? 0).toBeLessThanOrEqual(3); // only "it is not a discount" in the Promise terms
  });
});

test.describe('hand-off, consent and cross-surface sync', () => {
  test('consent is unticked, Send is gated, and the expert sees a masked number until booking', async ({ context, page }) => {
    const expert = await context.newPage();
    await expert.setViewportSize({ width: 1180, height: 820 });
    await expert.goto('/expert');
    await toMatch(page, FAMILY);
    await tid(page, 'see-compare').click();
    for (let i = 0; i < 4; i++) await tid(page, 'next').click();
    await tid(page, 'ho-phone').click();
    await expect(tid(page, 'consent-tick')).not.toBeChecked();
    await expect(tid(page, 'send')).toBeDisabled();
    for (const d of '9000000000') await tid(page, `digit-${d}`).click();
    await expect(tid(page, 'send')).toBeDisabled();
    await tid(page, 'consent-tick').check();
    await expect(tid(page, 'send')).toBeEnabled();
    await tid(page, 'send').click();
    await expect(tid(page, 'sent')).toBeVisible();
    await expect(page.locator('.panel')).toContainText('कोई मैसेज नहीं भेजा जाता');

    await expect(expert.getByTestId('ex-card-live')).toHaveCount(1);
    await expert.getByTestId('ex-card-live').click();
    await expect(expert.getByTestId('ex-phone')).toHaveText('••••••••00');
    await expect(expert.getByTestId('ex-detail')).not.toContainText('9000000000');
    await expect(expert.getByTestId('clock').first()).toHaveAttribute('data-state', 'ok');
    await expect(expert.getByTestId('ex-talk')).toContainText('lead with the crash rating');
    await expect(expert.locator('.rule-line')).toContainText('Do not lead with discount');
    await expert.getByTestId('act-confirm').click();
    await expect(expert.getByTestId('ex-phone')).toHaveText('9000000000');
    await expect(expert.getByTestId('lead-status')).toHaveText('Drive booked');
    await expect(expert.locator('.ex-clock')).toContainText('Clock stopped');
  });

  test('talking to an expert pushes the brief to the tablet; a session with no hand-off never reaches it', async ({ context, page }) => {
    const expert = await context.newPage();
    await expert.setViewportSize({ width: 1180, height: 820 });
    await expert.goto('/expert');
    await toMatch(page, UPGRADER);
    await expect(expert.getByTestId('ex-card-live')).toHaveCount(0);
    await tid(page, 'see-compare').click();
    await tid(page, 'next').click();
    await tid(page, 'ask-input').fill('can it tow a caravan');
    await tid(page, 'ask-send').click();
    for (let i = 0; i < 3; i++) await tid(page, 'next').click();
    await tid(page, 'ho-talk').click();
    await expect(tid(page, 'talked')).toContainText('[EXPERT NAME]');
    await expect(expert.getByTestId('ex-card-live')).toHaveCount(1);
    await expert.getByTestId('ex-card-live').click();
    await expect(expert.locator('.ex-q li.is-open')).toContainText('can it tow a caravan');
    await expect(expert.getByTestId('ex-consent')).toHaveText('No number shared.');
    const council = await context.newPage();
    await council.setViewportSize({ width: 1440, height: 900 });
    await council.goto('/council');
    await expect(council.getByTestId('live-gap')).toContainText('can it tow a caravan');
  });

  test('the QR payload opens a working phone page with no personal data, and delete works', async ({ context, page }) => {
    await toMatch(page, UPGRADER);
    await tid(page, 'see-compare').click();
    await tid(page, 'next').click();
    await tid(page, 'chip-twin.same').click();
    for (let i = 0; i < 3; i++) await tid(page, 'next').click();
    await tid(page, 'ho-qr').click();
    const url = (await tid(page, 'qr').getAttribute('data-url'))!;
    const phone = await context.newPage();
    const log = watchConsole(phone);
    await phone.setViewportSize({ width: 390, height: 844 });
    await phone.goto(url);
    await expect(phone.getByTestId('m-pick')).toContainText('Grand Vitara');
    await expect(phone.getByTestId('m-compare')).toContainText('Urban Cruiser Hyryder');
    await expect(phone.getByTestId('m-questions')).toContainText('same car');
    await expect(phone.getByTestId('m-promises')).toContainText('Proposed: pilot');
    expect(await phone.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    expect(await untracedNumbers(phone)).toEqual([]);
    expect(await axeProblems(phone)).toEqual([]);
    await phone.getByTestId('m-lang').click();
    await expect(phone.locator('h1')).toHaveText('आपकी तुलना');
    await phone.getByTestId('m-delete').click();
    await expect(phone.getByTestId('m-deleted')).toBeVisible();
    await phone.reload();
    await expect(phone.getByTestId('m-deleted')).toBeVisible();
    expect(log).toEqual([]);
  });

  test('a malformed phone link shows a friendly error', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/m#this-is-not-a-payload');
    await expect(page.getByTestId('m-error')).toContainText('did not open properly');
    await page.goto('/m');
    await expect(page.getByTestId('m-error')).toBeVisible();
  });
});

test.describe('every number is traceable, controls are reachable, pages are accessible', () => {
  for (const persona of [UPGRADER, FAMILY, STYLIST]) {
    test(`kiosk audit: ${persona.channel} / ${persona.lang} / ${persona.fuel}`, async ({ page }) => {
      const problems: string[] = [];
      const check = async (name: string) => {
        for (const n of await untracedNumbers(page)) problems.push(`${name}: untraced number "${n}"`);
        if (name !== '01-attract') for (const r of await reachProblems(page)) problems.push(`${name}: ${r}`);
        for (const a of await axeProblems(page)) problems.push(`${name}: axe ${a}`);
      };
      await toMatch(page, persona, check);
      await tid(page, 'see-compare').click();
      if (persona.rivals[0] === 'notsure') await tid(page, 'add-cr').click();
      for (const g of ['running', 'basics', 'safety', 'ownership']) { await tid(page, `group-${g}`).click(); await check(`11-compare-${g}`); }
      await tid(page, 'next').click();
      await page.locator('.chipbtn').first().click();
      await check('12-ask');
      await tid(page, 'next').click();
      await tid(page, 'basis-owner').click();
      await check('13-costs');
      await tid(page, 'next').click();
      for (const t of ['promise', 'pledge', 'weekend']) { await tid(page, `tab-${t}`).click(); await check(`14-promises-${t}`); }
      await tid(page, 'next').click();
      await check('15-handoff');
      await tid(page, 'ho-phone').click();
      await check('16-handoff-phone');
      await tid(page, 'next').isVisible();
      await page.getByRole('button', { name: /Back|पीछे/ }).click();
      await tid(page, 'ho-book').click();
      await check('17-handoff-book');
      await page.getByRole('button', { name: /Back|पीछे/ }).click();
      await tid(page, 'ho-qr').click();
      await check('18-handoff-qr');
      await tid(page, 'qr-done').click();
      await check('19-done');
      expect(problems).toEqual([]);
    });
  }

  const pages: Array<[string, string, number, number]> = [
    ['expert', '/expert', 1180, 820], ['council', '/council', 1440, 900], ['about', '/about', 1280, 900], ['demo', '/demo', 1440, 900],
  ];
  for (const [name, url, width, height] of pages) {
    test(`${name}: numbers traced, axe clean, console clean, keyboard reachable`, async ({ page }) => {
      const log = watchConsole(page);
      await page.setViewportSize({ width, height });
      await page.goto(url);
      await page.waitForLoadState('networkidle');
      expect(await untracedNumbers(page)).toEqual([]);
      expect(await axeProblems(page)).toEqual([]);
      await page.keyboard.press('Tab');
      expect(await page.evaluate(() => document.activeElement?.tagName)).not.toBe('BODY');
      expect(log).toEqual([]);
    });
  }
  test('council: simulated data is labelled and filters work', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/council');
    await expect(page.getByTestId('sim-banner')).toContainText('Simulated pilot data');
    const before = await page.getByTestId('tile-funnel').innerText();
    await page.getByLabel('Channel').selectOption('arena');
    expect(await page.getByTestId('tile-funnel').innerText()).not.toBe(before);
    await page.getByTestId('tile-funnel').locator('[data-sim]').first().click();
    await expect(page.getByTestId('pop')).toContainText('Simulated figure');
  });
  test('about: every fact is listed with its source', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/about');
    await expect(page.locator('table.facts tbody tr')).toHaveCount(411);
    await page.getByTestId('only-gaps').check();
    await expect(page.locator('table.facts tbody tr')).toHaveCount(85);
  });
  test('tapping a number opens its source; the Sources button lists every fact on screen', async ({ page }) => {
    await toMatch(page, UPGRADER);
    await page.locator('.screen-match .car-price .fact').click();
    await expect(tid(page, 'pop')).toContainText('CarDekho');
    await expect(tid(page, 'pop')).toContainText('2026-10-12');
    await page.getByRole('button', { name: 'Close' }).click();
    await tid(page, 'sources').click();
    await expect(tid(page, 'pop').locator('.sources li').first()).toBeVisible();
    expect(await tid(page, 'pop').locator('.sources li').count()).toBeGreaterThan(5);
  });
});

test.describe('scaling', () => {
  for (const [w, h] of [[1366, 768], [1920, 1080], [390, 844]] as const) {
    test(`kiosk and tablet fit a ${w} x ${h} screen without scrolling`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: h });
      for (const url of ['/kiosk?channel=nexa', '/expert']) {
        await page.goto(url);
        const box = await page.locator('.stage-box').boundingBox();
        expect(box!.width).toBeLessThanOrEqual(w + 1);
        expect(box!.height).toBeLessThanOrEqual(h + 1);
        expect(Math.max(box!.width / w, box!.height / h)).toBeGreaterThan(0.98);
        expect(await page.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight + 1)).toBe(true);
      }
      await page.goto('/kiosk?channel=arena');
      await tid(page, 'start').click();
      await expectStep(page, 'language');
    });
  }
});
