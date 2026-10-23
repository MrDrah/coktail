// US-NF-01: after the first load the app needs no network. The library and the matcher ship in the
// bundle, so searching and opening a recipe make no requests at all.
// Not covered: reloading the page while offline. The app has no service worker, so a reload needs
// the network; that would be a separate story (PWA / offline cache).
import { expect, test } from '@playwright/test';
import { search } from './helpers';

test('US-NF-01 after the first load, search and the detail view work offline with no network requests', async ({ page, context }) => {
  await page.goto('./');
  await page.waitForLoadState('networkidle');

  const requests: string[] = [];
  page.on('request', (r) => requests.push(r.url()));
  await context.setOffline(true);

  await search(page, 'white rum, lime, sugar, mint, soda');
  await expect(page.getByTestId('results-grid').getByRole('heading', { level: 3 }).first()).toHaveText('Mojito');
  await page.getByTestId('card-open-mojito').click();
  await expect(page.getByTestId('detail-dialog')).toBeVisible();
  await expect(page.getByTestId('detail-amount-white-rum')).toHaveText('45 ml');

  // A zero-match search (fallback + near matches) is offline too.
  await page.keyboard.press('Escape');
  await page.getByTestId('ingredient-clear-all').click();
  await search(page, 'gin, campari, cointreau');
  await expect(page.getByTestId('fallback-title')).toHaveText('No direct matches found');

  expect(requests).toEqual([]);
});
