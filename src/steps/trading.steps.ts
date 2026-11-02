import { expect } from '@playwright/test';
import { DataTable } from 'playwright-bdd';
import { env } from '../config/env';
import { MALFORMED_VALUE, pairFieldValidators, spotCategories } from '../data/trading';
import { Then, When } from '../fixtures/fixtures';
import type { MarketCategory } from '../support/apiClient';

Then('the spot market section is visible', async ({ explorePage }) => {
  const { spotMarket } = explorePage;
  await expect(spotMarket.heading).toBeVisible();
  await spotMarket.heading.scrollIntoViewIfNeeded();
  await expect(spotMarket.table).toBeVisible({ timeout: env.timeouts.contentLoad });
  for (const label of Object.keys(spotCategories)) {
    await expect(spotMarket.category(label), `category tab "${label}"`).toBeVisible();
  }
});

const expectMinPairs = async (explorePage: import('../pages/ExplorePage').ExplorePage, min: number) => {
  await expect
    .poll(() => explorePage.spotMarket.rows.count(), {
      message: `spot market should list at least ${min} pairs`,
      timeout: env.timeouts.contentLoad,
    })
    .toBeGreaterThanOrEqual(min);
};

Then('the spot market lists at least {int} trading pairs', async ({ explorePage }, min: number) => {
  await expectMinPairs(explorePage, min);
});

Then(
  'the spot market lists at least {int} trading pairs within the content load budget',
  async ({ explorePage }, min: number) => {
    await expectMinPairs(explorePage, min);
  },
);

When('I select the {string} spot market category', async ({ explorePage }, label: string) => {
  await explorePage.spotMarket.heading.scrollIntoViewIfNeeded();
  await explorePage.spotMarket.selectCategory(label);
});

Then(
  'every listed pair belongs to the {string} category in the market data feed',
  async ({ explorePage, ctx, api, $testInfo: testInfo }, label: string) => {
    const categoryId = spotCategories[label];
    expect(categoryId, `no API id mapped for category "${label}"`).toBeDefined();

    const loadFeed = async (): Promise<MarketCategory[]> => ctx.marketWidget ?? (await api.marketWidget()).body;

    // Prices update live, so allow the UI and the feed a few polls to agree.
    await expect
      .poll(
        async () => {
          const feed = (await loadFeed()).find((c) => c.id === categoryId);
          if (!feed) return `category "${categoryId}" missing from feed`;
          const shown = await explorePage.spotMarket.symbols();
          const positions = shown.map((s) => feed.items.indexOf(s));
          const unknown = shown.filter((_, i) => positions[i] === -1);
          if (unknown.length) return `not in "${categoryId}" feed: ${unknown.join(', ')}`;
          const ordered = positions.every((p, i) => i === 0 || p > positions[i - 1]);
          return ordered ? 'ok' : `UI order [${shown.join(', ')}] differs from feed order`;
        },
        { timeout: env.timeouts.contentLoad, message: `pairs shown under "${label}"` },
      )
      .toBe('ok');

    await testInfo.attach(`${label}-pairs.json`, {
      body: JSON.stringify(await explorePage.spotMarket.readRows(), null, 2),
      contentType: 'application/json',
    });
  },
);

When('I remember the listed pairs as {string}', async ({ explorePage, ctx }, key: string) => {
  ctx.rememberedPairs.set(key, await explorePage.spotMarket.symbols());
});

Then('the pair lists {string} and {string} are different', async ({ ctx }, a: string, b: string) => {
  const first = ctx.rememberedPairs.get(a);
  const second = ctx.rememberedPairs.get(b);
  expect(first?.length, `no pairs remembered as "${a}"`).toBeGreaterThan(0);
  expect(second?.length, `no pairs remembered as "${b}"`).toBeGreaterThan(0);
  expect(first, 'switching category did not change the listed pairs').not.toEqual(second);
});

Then('every listed trading pair satisfies these field rules:', async ({ explorePage, $testInfo: testInfo }, table: DataTable) => {
  const rules = table.hashes() as Array<{ field: string; rule: string }>;
  for (const { rule } of rules) {
    expect(pairFieldValidators[rule], `unknown field rule "${rule}"`).toBeDefined();
  }

  await expectMinPairs(explorePage, 1);
  const rows = await explorePage.spotMarket.readRows();
  await testInfo.attach('spot-market-rows.json', { body: JSON.stringify(rows, null, 2), contentType: 'application/json' });

  const failures = rows.flatMap((row) =>
    rules
      .map(({ field, rule }) => {
        const error = pairFieldValidators[rule](row);
        return error ? `row ${row.index} [${field}]: ${error}` : null;
      })
      .filter((e): e is string => e !== null),
  );
  expect(failures, 'trading pair field violations').toEqual([]);
});

Then('the spot market shows no malformed values', async ({ explorePage }) => {
  const cells = await explorePage.spotMarket.cellTexts();
  const malformed = cells.filter((text) => MALFORMED_VALUE.test(text.trim()));
  expect(malformed, 'cells rendering NaN/undefined/null').toEqual([]);
});

When('I open the first listed trading pair', async ({ explorePage, ctx }) => {
  await expectMinPairs(explorePage, 1);
  const [first] = await explorePage.spotMarket.readRows();
  ctx.data.set('selectedPair', first);
  await explorePage.spotMarket.rows.first().locator('a').first().click();
});

Then('I am on the asset page of that trading pair', async ({ page, ctx }) => {
  const pair = ctx.data.get('selectedPair') as { symbol: string; name: string };
  await page.waitForURL(new RegExp(`/explore/${pair.symbol}/?$`, 'i'));
  await expect(page.locator('body')).toContainText(pair.symbol, { timeout: env.timeouts.contentLoad });
  await expect(page).toHaveTitle(/\S/);
});
