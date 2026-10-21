// Result caps, zero-match fallback, near matches and the empty state (US-E4, US-E6).
import { expect, test } from '@playwright/test';
import { search } from './helpers';

test.beforeEach(async ({ page }) => {
  await page.goto('./');
});

test('US-E4-01 single result shows "Just one" and no Near Matches', async ({ page }) => {
  await search(page, 'gin, orange liqueur, lemon juice');
  await expect(page.getByTestId('results-count')).toHaveText(/cocktails? you can make right now/);
  await expect(page.getByTestId('near-matches')).toHaveCount(0);
});

test('US-E4-01 results never exceed 6 with 2–4 ingredients', async ({ page }) => {
  await search(page, 'gin, lemon juice, simple syrup, soda water');
  const cards = page.getByTestId('results-grid').locator('article');
  expect(await cards.count()).toBeLessThanOrEqual(6);
});

test('US-E6 zero match: notice, best addition, near matches; one tap adds and re-searches', async ({ page }) => {
  await search(page, 'gin, campari, cointreau');
  await expect(page.getByTestId('fallback-title')).toHaveText('No direct matches found');
  await expect(page.getByTestId('fallback-title')).toBeFocused();
  await expect(page.getByTestId('best-addition')).toContainText('Add Dry Vermouth to unlock 3 cocktails');
  await expect(page.getByTestId('near-matches-title')).toHaveText('Near Matches — missing 1 ingredient');
  await expect(page.getByTestId('near-card-white-lady')).toBeVisible();
  await expect(page.getByTestId('near-add-lemon-juice-white-lady')).toBeVisible();

  await page.getByTestId('best-addition-add').click();
  await expect(page.getByTestId('chip-dry-vermouth')).toBeVisible();
  await expect(page.getByTestId('card-cardinale')).toBeVisible();
  await expect(page.getByTestId('fallback')).toHaveCount(0);
});

test('US-E6-04 near-match "+ Add" on a card adds that ingredient', async ({ page }) => {
  await search(page, 'white rum, lime juice');
  await expect(page.getByTestId('near-card-daiquiri')).toBeVisible();
  await page.getByTestId('near-add-sugar-daiquiri').click();
  await expect(page.getByTestId('chip-sugar')).toBeVisible();
  await expect(page.getByTestId('card-daiquiri')).toBeVisible();
});

test('US-E6-04 "+ Add" is hidden at 10 ingredients and returns at 9', async ({ page }) => {
  await page.goto('./?i=gin,vodka,mint,salt,cola,cream,espresso,port,galliano,sake');
  await expect(page.getByTestId('fallback')).toBeVisible();
  await expect(page.locator('.add-button')).toHaveCount(0);
  await expect(page.getByTestId('fallback-tip')).toHaveText('Tip: a citrus juice or a sweetener unlocks the most drinks.');
  await expect(page.locator('[data-testid^="near-missing-"]').first()).toBeVisible();
  await page.getByTestId('chip-remove-sake').click();
  await expect(page.getByTestId('best-addition-add')).toBeVisible();
  await expect(page.locator('[data-testid^="near-add-"]').first()).toBeVisible();
});

test('US-E6-05 nothing at all: empty state, Start over clears chips', async ({ page }) => {
  await search(page, 'port, galliano');
  await expect(page.getByTestId('empty-state')).toContainText('Nothing to pour… yet');
  await expect(page.getByTestId('near-matches')).toHaveCount(0);
  await page.getByTestId('empty-reset').click();
  await expect(page.getByTestId('chip-list').locator('li')).toHaveCount(0);
  await expect(page.getByTestId('ingredient-input')).toBeFocused();
});

test('US-E3-07 collins drinks need soda water', async ({ page }) => {
  await search(page, 'gin, lemon juice, simple syrup');
  await expect(page.getByTestId('card-john-collins')).toHaveCount(0);
  await page.goto('./?i=gin,lemon-juice,simple-syrup,soda-water');
  await expect(page.getByTestId('card-john-collins')).toBeVisible();
});
