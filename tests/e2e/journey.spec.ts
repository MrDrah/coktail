// Full user journey: input → search → card → detail → close (QA brief Step 4, US-E1..E5, US-NF-04).
import { expect, test } from '@playwright/test';
import { addIngredients, cta, expectNoHorizontalScroll, input, search } from './helpers';

test.beforeEach(async ({ page }) => {
  await page.goto('./');
});

test('landing page renders with search disabled', async ({ page }) => {
  await expect(page).toHaveTitle('Cocktail Cabinet');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('What’s in your cabinet?');
  await expect(cta(page)).toHaveAttribute('aria-disabled', 'true');
  await expect(page.getByTestId('search-helper')).toHaveText('Add at least 2 ingredients to search.');
  await expectNoHorizontalScroll(page);
});

test('US-E3-02 five ingredients: Mojito first, Daiquiri included, URL updated', async ({ page }) => {
  await search(page, 'white rum, lime, sugar, mint, club soda');
  const names = page.getByTestId('results-grid').getByRole('heading', { level: 3 });
  await expect(names.first()).toHaveText('Mojito');
  await expect(names).toContainText(['Mojito', 'Daiquiri']);
  await expect(page.getByTestId('results-count')).toHaveText('2 cocktails you can make right now');
  await expect(page.getByTestId('results-title')).toBeFocused();
  await expect(page).toHaveURL(/i=white-rum%2Clime-juice%2Csugar%2Cmint%2Csoda-water/);
  await expectNoHorizontalScroll(page);
});

test('US-E4-03 cards show name, short description, taste profile and highlighted ingredients', async ({ page }) => {
  await search(page, 'white rum, lime, sugar');
  const card = page.getByTestId('card-daiquiri');
  await expect(card.getByRole('heading')).toHaveText('Daiquiri');
  await expect(card.getByTestId('card-desc-daiquiri')).toContainText('three-ingredient classic');
  await expect(card.getByTestId('card-taste-daiquiri')).toContainText('Crisp, clean');
  await expect(card.getByTestId('card-glass-daiquiri')).toHaveText('Cocktail Glass');
  await expect(card.getByTestId('card-ingredient-daiquiri-white-rum')).toHaveAttribute('data-matched', 'true');
});

test('US-E5 detail dialog: scaling in ml, assumed ice, Esc closes and returns focus', async ({ page }) => {
  await search(page, 'white rum, lime, sugar, mint, soda');
  await page.getByTestId('card-open-mojito').click();
  const dialog = page.getByTestId('detail-dialog');
  await expect(dialog).toBeVisible();
  await expect(page.getByTestId('detail-title')).toBeFocused();
  await expect(page.getByTestId('servings-value')).toContainText('1');
  await expect(page.getByTestId('servings-decrease')).toBeDisabled();
  await expect(page.getByTestId('detail-amount-white-rum')).toHaveText('45 ml');
  await expect(page.getByTestId('detail-ingredient-ice')).toHaveAttribute('data-assumed', 'true');
  await expect(page.getByTestId('detail-ingredient-ice')).toContainText('Assumed');

  for (let i = 0; i < 3; i++) await page.getByTestId('servings-increase').click();
  await expect(page.getByTestId('servings-increase')).toBeDisabled();
  await expect(page.getByTestId('detail-amount-white-rum')).toHaveText('180 ml');
  await expect(page.getByTestId('detail-amount-soda-water')).toHaveText('Top up');
  await expect(dialog).not.toContainText(/\boz\b/);

  await expect(page.getByTestId('detail-source-0')).toHaveAttribute('href', /^https:\/\//);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(page.getByTestId('card-open-mojito')).toBeFocused();
});

test('US-E5-01 activating a card opens the full recipe: amounts, optional and assumed rows, method, glass, garnish, history, taste, sources', async ({ page }) => {
  // Army and Navy: gin, lemon juice, orgeat, Angostura, with optional salt and assumed ice.
  await search(page, 'gin, lemon juice, orgeat, angostura bitters');
  await page.getByTestId('card-open-army-and-navy').click();
  const dialog = page.getByTestId('detail-dialog');
  await expect(dialog).toBeVisible();
  await expect(page.getByTestId('detail-title')).toHaveText('Army and Navy');

  await expect(page.getByTestId('detail-amount-gin')).toHaveText(/^\d+(\.\d+)? ml$/);
  await expect(page.getByTestId('detail-ingredient-salt')).toContainText('optional');
  await expect(page.getByTestId('detail-ingredient-ice')).toHaveAttribute('data-assumed', 'true');
  await expect(page.getByTestId('detail-ingredient-ice')).toContainText('Assumed');

  expect(await page.getByTestId('detail-method').locator('li').count()).toBeGreaterThan(0);
  await expect(page.getByTestId('detail-glass')).not.toBeEmpty();
  await expect(page.getByTestId('detail-garnish')).not.toBeEmpty();

  const history = page.getByTestId('detail-history').locator('p');
  const paragraphs = await history.count();
  expect(paragraphs).toBeGreaterThanOrEqual(1);
  expect(paragraphs).toBeLessThanOrEqual(2);
  await expect(page.getByTestId('detail-taste')).not.toBeEmpty();
  await expect(page.getByTestId('detail-source-0')).toHaveAttribute('href', /^https:\/\//);
});

test('US-E5-03 close button and backdrop close the dialog', async ({ page }) => {
  await search(page, 'gin, campari, sweet vermouth');
  await page.getByTestId('card-open-negroni').click();
  await page.getByTestId('detail-close').click();
  await expect(page.getByTestId('detail-dialog')).toBeHidden();
  await page.getByTestId('card-open-negroni').click();
  await page.mouse.click(5, 5); // backdrop
  await expect(page.getByTestId('detail-dialog')).toBeHidden();
});

test('US-NF-04 reloading the URL restores results; back button restores the previous search', async ({ page }) => {
  await search(page, 'gin, campari, sweet vermouth');
  await expect(page.getByTestId('card-negroni')).toBeVisible();
  await page.reload();
  await expect(page.getByTestId('chip-sweet-vermouth')).toBeVisible();
  await expect(page.getByTestId('card-negroni')).toBeVisible();

  await page.getByTestId('chip-remove-campari').click();
  await addIngredients(page, 'dry vermouth');
  await cta(page).click();
  await expect(page.getByTestId('card-dry-martini')).toBeVisible();
  await page.goBack();
  await expect(page.getByTestId('card-negroni')).toBeVisible();
  await expect(page.getByTestId('chip-campari')).toBeVisible();
});

test('stale results: changing chips after a search offers "Update results"', async ({ page }) => {
  await search(page, 'gin, campari, sweet vermouth');
  await addIngredients(page, 'bourbon');
  await expect(cta(page)).toHaveText('Update results');
  await expect(page.getByText('Results are for your previous list')).toBeVisible();
  await cta(page).click();
  await expect(page.getByTestId('card-boulevardier')).toBeVisible();
});

test('theme toggle switches between light and dark', async ({ page }) => {
  const before = await page.evaluate(() => document.documentElement.dataset.theme);
  await page.getByRole('button', { name: /Switch to (light|dark) theme/ }).click();
  const after = await page.evaluate(() => document.documentElement.dataset.theme);
  expect(after).not.toBe(before);
  await page.reload();
  expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe(after);
  await expect(input(page)).toBeVisible();
});
