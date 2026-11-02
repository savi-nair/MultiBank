import { expect } from '@playwright/test';
import { env } from '../config/env';
import { botProtectedHosts, linkSkipList, marketDataRoutes, serverErrorText, thirdPartyChatRoutes } from '../data/links';
import { After, Given, Then, When } from '../fixtures/fixtures';
import { checkLinks, formatLinkReport } from '../support/linkChecker';
import { localizedPath, uniqueSuffix } from '../support/url';

// ---------- Invalid routes ----------

When('I request the unknown route {string}', async ({ page, ctx }, rawPath: string) => {
  const path = rawPath.replace('{unique}', uniqueSuffix());
  ctx.lastResponse = await page.goto(localizedPath(path), { waitUntil: 'domcontentloaded' });
});

Then('the response status is {int}', async ({ ctx, page }, status: number) => {
  expect(ctx.lastResponse, 'no document response').not.toBeNull();
  // A 200 here would be a "soft 404" - bad for SEO and for users.
  expect(ctx.lastResponse!.status(), `status for ${page.url()}`).toBe(status);
});

Then('the page does not expose a server error', async ({ page }) => {
  const body = await page.locator('body').innerText();
  expect(body, 'stack trace / server error leaked to the page').not.toMatch(serverErrorText);
});

// ---------- Broken links ----------

Then('none of the links in the {word} are broken', async ({ sitePage, request, $testInfo: testInfo }, area: string) => {
  const hrefs =
    area === 'header'
      ? await sitePage.header.absoluteHrefs()
      : area === 'footer'
        ? await sitePage.footer.absoluteHrefs()
        : (() => {
            throw new Error(`Unknown link area "${area}" (use header or footer)`);
          })();

  const urls = [...new Set(hrefs.filter((h) => /^https?:/i.test(h)))];
  expect(urls.length, `no links found in the ${area}`).toBeGreaterThan(0);

  const results = await checkLinks(request, urls, {
    concurrency: env.linkCheck.concurrency,
    timeout: env.linkCheck.timeout,
    skip: linkSkipList,
    botProtectedHosts,
  });

  await testInfo.attach(`${area}-link-report.md`, { body: formatLinkReport(results), contentType: 'text/markdown' });

  for (const blocked of results.filter((r) => r.verdict === 'blocked')) {
    testInfo.annotations.push({ type: 'warning', description: `bot-protected: ${blocked.url} -> ${blocked.status}` });
  }
  const broken = results.filter((r) => r.verdict === 'broken').map((r) => `${r.status ?? r.note} ${r.url}`);
  expect(broken, `broken links in the ${area}`).toEqual([]);
});

// ---------- Content loading / timeouts ----------

Given('market data responses are delayed by {int} seconds', async ({ page }, seconds: number) => {
  for (const pattern of marketDataRoutes) {
    await page.route(pattern, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, seconds * 1000));
      await route.continue().catch(() => undefined);
    });
  }
});

Given('market data requests fail', async ({ page }) => {
  for (const pattern of marketDataRoutes) {
    await page.route(pattern, (route) => route.abort('failed'));
  }
});

Given('third-party chat requests never respond', async ({ page }) => {
  for (const pattern of thirdPartyChatRoutes) {
    await page.route(pattern, async (route) => {
      // Simulate a hung connection for longer than the whole scenario.
      await new Promise((resolve) => setTimeout(resolve, env.timeouts.test));
      await route.abort('timedout').catch(() => undefined);
    });
  }
});

After({ tags: '@timeout' }, async ({ page }) => {
  await page.unrouteAll({ behavior: 'ignoreErrors' });
});

Then('the page shell renders within {int} seconds', async ({ sitePage }, seconds: number) => {
  const timeout = seconds * 1000;
  await expect(sitePage.header.root).toBeVisible({ timeout });
  await expect(sitePage.mainHeading).toBeVisible({ timeout });
});

Then('no uncaught JavaScript errors occurred', async ({ ctx }) => {
  expect(ctx.pageErrors, 'uncaught exceptions in the page').toEqual([]);
});
