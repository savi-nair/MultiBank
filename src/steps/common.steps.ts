import { expect } from '@playwright/test';
import { DataTable } from 'playwright-bdd';
import { env } from '../config/env';
import { resolvePage } from '../data/pages';
import { Given, Then, When } from '../fixtures/fixtures';
import type { MarketCategory } from '../support/apiClient';

Given('I open the {string} page', async ({ page, sitePage, ctx }, name: string) => {
  const target = resolvePage(name);

  // Keep the latest market-widget payload the page itself received; the
  // trading steps use it as the oracle for what the UI should display.
  page.on('response', async (response) => {
    if (/\/market\/widget(\?|$)/.test(response.url()) && response.ok()) {
      ctx.marketWidget = (await response.json().catch(() => null)) as MarketCategory[] | null;
    }
  });

  const response = await sitePage.open(target.path);
  ctx.lastResponse = response;

  expect(response, `navigation to "${name}" returned no document response`).not.toBeNull();
  expect(response!.status(), `"${name}" (${page.url()}) HTTP status`).toBeLessThan(400);
  await expect(sitePage.header.root).toBeVisible();
  if (target.heading) {
    await expect(sitePage.mainHeading).toHaveText(target.heading, { timeout: env.timeouts.contentLoad });
  }
});

When('I reload the page', async ({ page, sitePage }) => {
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(sitePage.header.root).toBeVisible();
});

Given('the browser viewport is {int}x{int}', async ({ page }, width: number, height: number) => {
  await page.setViewportSize({ width, height });
});

Then('the page has no horizontal overflow', async ({ sitePage }) => {
  // Poll: late-loading content (fonts, carousels) can shift layout briefly.
  await expect.poll(() => sitePage.horizontalOverflow(), { message: 'document wider than viewport (px)' }).toBeLessThanOrEqual(1);
});

Then('the main heading is {string}', async ({ sitePage }, text: string) => {
  await expect(sitePage.mainHeading).toHaveText(text, { timeout: env.timeouts.contentLoad });
});

Then('every visible image on the page has loaded', async ({ sitePage }) => {
  await sitePage.scrollThrough();
  await expect.poll(() => sitePage.brokenImages(), { message: 'images that failed to load' }).toEqual([]);
});

/** Helper for single-column data tables (| Explore |). */
export function column(table: DataTable): string[] {
  return table.raw().map((row) => row[0].trim());
}
