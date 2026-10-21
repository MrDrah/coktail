import { expect, type Page } from '@playwright/test';

export const input = (page: Page) => page.getByTestId('ingredient-input');
export const cta = (page: Page) => page.getByTestId('search-button');

/** Types ingredients (comma-separated is fine) and commits them with Enter. */
export async function addIngredients(page: Page, text: string) {
  await input(page).click();
  await input(page).fill('');
  await input(page).pressSequentially(text);
  await input(page).press('Enter');
}

export async function search(page: Page, text: string) {
  await addIngredients(page, text);
  await cta(page).click();
}

export async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
}
