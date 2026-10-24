// Accessibility (QA brief Step 5): axe-core with zero serious/critical violations, in both themes,
// plus a keyboard-only journey (US-NF-02).
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { input, search } from './helpers';

async function expectNoSeriousViolations(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(serious.map((v) => `${v.id}: ${v.help} (${v.nodes.length} nodes) ${v.nodes[0]?.target}`)).toEqual([]);
}

for (const theme of ['light', 'dark'] as const) {
  test.describe(`${theme} theme`, () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript((t) => localStorage.setItem('theme', t), theme);
    });

    test('landing page', async ({ page }) => {
      await page.goto('./');
      await expectNoSeriousViolations(page);
    });

    test('results', async ({ page }) => {
      await page.goto('./?i=white-rum,lime-juice,sugar,mint,soda-water');
      await expect(page.getByTestId('results-grid')).toBeVisible();
      await expectNoSeriousViolations(page);
    });

    test('errors and ambiguity chooser', async ({ page }) => {
      await page.goto('./');
      await input(page).click();
      await input(page).pressSequentially('gin, campary, orange');
      await input(page).press('Enter');
      await expect(page.getByTestId('ambiguity-chooser')).toBeVisible();
      await expectNoSeriousViolations(page);
    });

    test('fallback and near matches', async ({ page }) => {
      await page.goto('./?i=gin,campari,orange-liqueur');
      await expect(page.getByTestId('fallback')).toBeVisible();
      await expectNoSeriousViolations(page);
    });

    test('detail dialog', async ({ page }) => {
      await page.goto('./?i=white-rum,lime-juice,sugar,mint,soda-water');
      await page.getByTestId('card-open-mojito').click();
      await expect(page.getByTestId('detail-dialog')).toBeVisible();
      await expectNoSeriousViolations(page);
    });
  });
}

test('US-NF-02 keyboard-only journey: type, search, open a card, scale, close', async ({ page, isMobile }) => {
  test.skip(isMobile, 'keyboard journey is a desktop check');
  await page.goto('./');
  await page.keyboard.press('Tab'); // skip link
  await page.keyboard.press('Tab'); // theme toggle
  await page.keyboard.press('Tab'); // ingredient input
  await expect(input(page)).toBeFocused();
  await page.keyboard.type('white rum, lime, sugar');
  await page.keyboard.press('Enter');
  // Tab to the CTA past the chip remove buttons and "Clear all".
  for (let i = 0; i < 10 && !(await page.getByTestId('search-button').evaluate((el) => el === document.activeElement)); i++) {
    await page.keyboard.press('Tab');
  }
  await expect(page.getByTestId('search-button')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('results-title')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByTestId('card-open-daiquiri')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('detail-title')).toBeFocused();
  await page.getByTestId('servings-increase').focus();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('detail-amount-white-rum')).toHaveText('120 ml');
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('card-open-daiquiri')).toBeFocused();
});

test('US-E4-05 the result count is announced in a polite live region as "<k> cocktails found"', async ({ page }) => {
  await page.goto('./');
  const status = page.getByTestId('results-status');
  await expect(status).toHaveAttribute('aria-live', 'polite');
  await search(page, 'gin, campari, sweet vermouth');
  const k = await page.getByTestId('results-grid').locator('article').count();
  expect(k).toBeGreaterThan(1);
  await expect(status).toHaveText(`${k} cocktails found`);
});
