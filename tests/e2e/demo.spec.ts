import { expect, test, type Page } from '@playwright/test';
import { watchConsole } from './helpers';

test.use({ viewport: { width: 1440, height: 900 } });

const kiosk = (page: Page) => page.frameLocator('[data-testid="frame-kiosk"]');
const tablet = (page: Page) => page.frameLocator('[data-testid="frame-tablet"]');
const stepOf = (page: Page) => kiosk(page).locator('.kiosk-root');

async function runTour(page: Page, id: string, steps: number) {
  await page.goto('/demo');
  await expect(stepOf(page)).toHaveAttribute('data-step', 'attract');
  await page.getByTestId(`tour-${id}`).click();
  // Runs by itself: no further input until the last step is reached and the tour stops playing.
  await expect(page.getByTestId('tour-step')).toHaveText(`Step ${steps} of ${steps}`, { timeout: 120_000 });
  await expect(page.getByTestId('tour-toggle')).toContainText('Play', { timeout: 20_000 });
}

test('tour: Arrived Upgrader runs end to end and hands off to the tablet', async ({ page }) => {
  const log = watchConsole(page);
  await runTour(page, 'upgrader', 9);
  await expect(stepOf(page)).toHaveAttribute('data-step', 'handoff');
  await expect(kiosk(page).getByTestId('talked')).toBeVisible();
  await expect(tablet(page).getByTestId('ex-card-live')).toHaveCount(1);
  await tablet(page).getByTestId('ex-card-live').click();
  await expect(tablet(page).getByTestId('ex-detail')).toContainText('Grand Vitara');
  await expect(tablet(page).getByTestId('ex-detail')).toContainText('Is the Toyota warranty longer?');
  await expect(page.getByTestId('caption')).toContainText('The product expert has the brief');
  expect(log).toEqual([]);
});

test('tour: First-SUV Family runs end to end in Hindi at Arena', async ({ page }) => {
  const log = watchConsole(page);
  await runTour(page, 'family', 9);
  await expect(kiosk(page).locator('.kiosk')).toHaveClass(/skin-arena/);
  await expect(kiosk(page).locator('.kiosk')).toHaveClass(/is-hi/);
  await expect(kiosk(page).getByTestId('sent')).toBeVisible();
  await expect(tablet(page).getByTestId('ex-card-live')).toHaveCount(1);
  await tablet(page).getByTestId('ex-card-live').click();
  await expect(tablet(page).getByTestId('ex-phone')).toHaveText('••••••••00');
  await expect(tablet(page).getByTestId('ex-detail')).toContainText('Victoris');
  expect(log).toEqual([]);
});

test('tour: Budget Stylist runs end to end and the QR opens on the phone', async ({ page }) => {
  const log = watchConsole(page);
  await runTour(page, 'stylist', 8);
  await expect(kiosk(page).getByTestId('qr')).toBeVisible();
  const phone = page.frameLocator('[data-testid="frame-phone"]');
  await expect(phone.getByTestId('m-pick')).toContainText('Fronx');
  await expect(phone.getByTestId('m-questions')).toContainText('set by your dealer');
  await expect(tablet(page).getByTestId('ex-card-live')).toHaveCount(0);
  expect(log).toEqual([]);
});

test('claims jump to the moment that proves them, and Reset all clears every surface', async ({ page }) => {
  await page.goto('/demo');
  await expect(stepOf(page)).toHaveAttribute('data-step', 'attract');
  await page.getByTestId('claim-3').click();
  await expect(stepOf(page)).toHaveAttribute('data-step', 'match');
  await expect(kiosk(page).getByTestId('cross')).toContainText('Arena');
  await page.getByTestId('claim-4').click();
  await expect(kiosk(page).getByTestId('twin')).toContainText('Bidadi');
  await page.getByTestId('claim-2').click();
  await expect(kiosk(page).getByTestId('honest-theirs')).toContainText('Creta is ahead on');
  await page.getByTestId('claim-1').click();
  await expect(kiosk(page).locator('[data-row="buyback"]')).toBeVisible();
  await page.getByTestId('claim-6').click();
  await expect(kiosk(page).getByTestId('consent-tick')).not.toBeChecked();
  await expect(kiosk(page).locator('.kiosk')).toHaveClass(/skin-arena/);
  await page.getByTestId('claim-5').click();
  await expect(tablet(page).getByTestId('ex-card-live')).toHaveCount(1);
  await page.getByTestId('claim-7').click();
  await expect(page.frameLocator('[data-testid="frame-council"]').getByTestId('sim-banner')).toBeVisible();
  await page.getByTestId('reset-all').click();
  await expect(stepOf(page)).toHaveAttribute('data-step', 'attract');
  await page.getByTestId('tab-tablet').click();
  await expect(tablet(page).getByTestId('ex-card-live')).toHaveCount(0);
  await page.getByTestId('ch-arena').click();
  await expect(kiosk(page).locator('.kiosk')).toHaveClass(/skin-arena/);
});

test('pause and step controls work', async ({ page }) => {
  await page.goto('/demo');
  await expect(stepOf(page)).toHaveAttribute('data-step', 'attract');
  await page.getByTestId('tour-stylist').click();
  await expect(page.getByTestId('tour-step')).toHaveText('Step 2 of 8', { timeout: 30_000 });
  await page.getByTestId('tour-toggle').click();
  await expect(page.getByTestId('tour-toggle')).toContainText('Play');
  await page.waitForTimeout(7000);
  await expect(page.getByTestId('tour-step')).toHaveText('Step 2 of 8');
  await page.getByTestId('tour-next').click();
  await expect(page.getByTestId('tour-step')).toHaveText('Step 3 of 8');
  await expect(stepOf(page)).toHaveAttribute('data-step', 'match', { timeout: 15_000 });
});
