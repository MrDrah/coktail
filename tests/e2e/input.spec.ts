// Input boundaries, parsing and error handling (QA brief Step 4, US-E1, US-E2).
import { expect, test } from '@playwright/test';
import { addIngredients, cta, input } from './helpers';

test.beforeEach(async ({ page }) => {
  await page.goto('./');
});

test('US-E1-03 one ingredient blocks search; two enable it', async ({ page }) => {
  await addIngredients(page, 'gin');
  await expect(cta(page)).toHaveAttribute('aria-disabled', 'true');
  await expect(page.getByTestId('search-helper')).toHaveText('Add 1 more ingredient to search.');
  // aria-disabled keeps it focusable; activating it must not search (force: Playwright treats it as disabled).
  await cta(page).click({ force: true });
  await expect(page.getByTestId('results')).toHaveCount(0);
  await addIngredients(page, 'campari');
  await expect(cta(page)).not.toHaveAttribute('aria-disabled', 'true');
});

test('US-E1-04 the 11th ingredient is rejected; 10 + ice + water is fine', async ({ page }) => {
  await addIngredients(page, 'gin, vodka, white rum, tequila, bourbon, campari, aperol, lime juice, lemon juice, sugar');
  await expect(page.getByTestId('ingredient-counter')).toHaveText('10 / 10 ingredients');
  await addIngredients(page, 'ice, water');
  await expect(page.getByTestId('hint-limit')).toHaveCount(0);
  await expect(page.getByTestId('hint-excluded')).toBeVisible();
  await addIngredients(page, 'mint');
  await expect(page.getByTestId('hint-limit')).toHaveText(/10-ingredient limit\. Remove one to add Mint\./);
  await expect(page.getByTestId('chip-mint')).toHaveCount(0);
  await expect(input(page)).toHaveValue('mint');
  await expect(cta(page)).not.toHaveAttribute('aria-disabled', 'true');
});

test('US-E1-05 only ice and water: counter stays 0 and search is blocked', async ({ page }) => {
  await addIngredients(page, 'crushed ice, tap water');
  await expect(page.getByTestId('ingredient-counter')).toHaveText('0 / 10 ingredients');
  await expect(page.getByTestId('hint-excluded')).toHaveText('Ice & water are always assumed. No need to add them.');
  await expect(page.getByTestId('search-helper')).toHaveText('Ice and water don’t count — add at least 2 other ingredients.');
});

for (const term of ['soda water', 'club soda', 'sparkling water', 'seltzer']) {
  test(`US-E1-06 "${term}" becomes a counted Soda Water chip`, async ({ page }) => {
    await addIngredients(page, term);
    await expect(page.getByTestId('chip-soda-water')).toHaveText(/Soda Water/);
    await expect(page.getByTestId('ingredient-counter')).toHaveText('1 / 10 ingredients');
  });
}

test('US-E1-07 synonym duplicates collapse into one chip', async ({ page }) => {
  await addIngredients(page, 'Lemon Juice, fresh lemon, LEMON ');
  await expect(page.getByTestId('chip-lemon-juice')).toHaveCount(1);
  await expect(page.getByTestId('ingredient-counter')).toHaveText('1 / 10 ingredients');
});

test('US-E1-02 Backspace arms then removes the last chip', async ({ page }) => {
  await addIngredients(page, 'gin, campari');
  await input(page).press('Backspace');
  await expect(page.getByTestId('chip-campari')).toHaveClass(/chip-armed/);
  await input(page).press('Backspace');
  await expect(page.getByTestId('chip-campari')).toHaveCount(0);
  await expect(page.getByTestId('chip-gin')).toBeVisible();
});

test('autocomplete: arrow keys and Enter pick a suggestion', async ({ page }) => {
  await input(page).click();
  await input(page).pressSequentially('verm');
  await expect(page.getByTestId('ingredient-listbox')).toBeVisible();
  await expect(page.getByTestId('ingredient-option-sweet-vermouth')).toBeVisible();
  await input(page).press('ArrowDown');
  await input(page).press('Enter');
  await expect(page.getByTestId('chip-list').locator('li')).toHaveCount(1);
  await expect(page.getByTestId('chip-list')).toContainText('Vermouth');
});

test('US-E2-02 typo shows "Did you mean" and the suggestion replaces the chip in place', async ({ page }) => {
  await addIngredients(page, 'gin, campary, sweet vermouth');
  await expect(page.getByTestId('chip-error-1')).toContainText('campary');
  await expect(page.getByTestId('ingredient-error')).toContainText('We don’t know “campary”. Did you mean:');
  await expect(cta(page)).toHaveAttribute('aria-disabled', 'true');
  await expect(page.getByTestId('search-helper')).toHaveText('Fix or remove the highlighted ingredient to search.');
  await page.getByTestId('suggestion-campari').click();
  await expect(page.getByTestId('chip-list').locator('li').nth(1)).toHaveAttribute('data-testid', 'chip-campari');
  await expect(cta(page)).not.toHaveAttribute('aria-disabled', 'true');
});

test('US-E2-04 unparseable input gets a friendly message and can be edited', async ({ page }) => {
  await addIngredients(page, 'asdfgh');
  await expect(page.getByTestId('ingredient-error')).toHaveText(/We don’t know “asdfgh” yet\. Check the spelling or try another name\./);
  await page.getByTestId('chip-edit-error-0').click();
  await expect(input(page)).toHaveValue('asdfgh');
  await expect(page.getByTestId('chip-error-0')).toHaveCount(0);
});

test('US-E2-04 markup is shown as inert text', async ({ page }) => {
  let dialogFired = false;
  page.on('dialog', (d) => {
    dialogFired = true;
    return d.dismiss();
  });
  await addIngredients(page, '<img src=x onerror=alert(1)>');
  await expect(page.getByTestId('chip-error-0')).toContainText('<img src=x onerror=alert(1)>');
  expect(dialogFired).toBe(false);
});

test('US-E2-03 ambiguous term: chooser opens, Esc keeps it pending, picking resolves it', async ({ page }) => {
  await addIngredients(page, 'orange');
  const chooser = page.getByTestId('ambiguity-chooser');
  await expect(chooser).toContainText('Which “orange” do you mean?');
  await expect(page.getByTestId('ambiguity-option-orange-juice')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(chooser).toHaveCount(0);
  await expect(page.getByTestId('chip-ambiguous-orange')).toBeVisible();
  await page.getByTestId('chip-ambiguous-orange').getByRole('button', { name: /orange.*needs a choice/ }).click();
  await page.getByTestId('ambiguity-option-orange-bitters').click();
  await expect(page.getByTestId('chip-orange-bitters')).toBeVisible();
});

test('Clear all removes every chip', async ({ page }) => {
  await addIngredients(page, 'gin, campari, mint');
  await page.getByTestId('ingredient-clear-all').click();
  await expect(page.getByTestId('chip-list').locator('li')).toHaveCount(0);
  await expect(input(page)).toBeFocused();
});
