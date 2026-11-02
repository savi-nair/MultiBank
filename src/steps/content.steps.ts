import { expect } from '@playwright/test';
import { DataTable } from 'playwright-bdd';
import { env } from '../config/env';
import { appStores, storeToPlatform } from '../data/content';
import { Then } from '../fixtures/fixtures';
import { resolveStoreLink, toHttpStoreUrl } from '../support/storeLinks';

Then('these marketing banners are visible in the promo region:', async ({ explorePage }, table: DataTable) => {
  const banners = table.hashes() as Array<{ title: string; subtitle: string }>;

  const headingBox = (await explorePage.mainHeading.boundingBox())!;
  const spotBox = (await explorePage.spotMarket.heading.boundingBox())!;
  expect(headingBox && spotBox, 'page heading / spot market heading not laid out').toBeTruthy();

  for (const { title, subtitle } of banners) {
    const banner = explorePage.banner(title);
    await expect(banner, `banner "${title}"`).toBeVisible();
    await expect(banner, `banner "${title}" subtitle`).toContainText(subtitle);

    // Region check: promos sit below the page heading and above the spot market.
    const box = (await banner.boundingBox())!;
    expect(box.y, `"${title}" renders above the page heading`).toBeGreaterThanOrEqual(headingBox.y + headingBox.height - 2);
    expect(box.y + box.height, `"${title}" overlaps the spot market`).toBeLessThanOrEqual(spotBox.y + 2);
  }
});

Then(
  'the {string} link resolves to the {string} listing for a {string} device',
  async ({ explorePage, request, $testInfo: testInfo }, linkName: string, store: string, platform: string) => {
    expect(storeToPlatform[store], `unknown store "${store}"`).toBe(platform);
    const spec = appStores[platform];

    const link = explorePage.downloadAppLink(linkName);
    await expect(link).toBeVisible();
    const href = await link.evaluate((a) => (a as HTMLAnchorElement).href);

    const { finalUrl, chain } = await resolveStoreLink(request, href, spec.userAgent);
    await testInfo.attach(`${platform}-redirect-chain.json`, {
      body: JSON.stringify({ href, finalUrl, chain }, null, 2),
      contentType: 'application/json',
    });

    const storeUrl = toHttpStoreUrl(finalUrl);
    expect(new URL(storeUrl).hostname, `${linkName} on ${platform} resolved to ${finalUrl}`).toMatch(spec.storeHost);
    expect(storeUrl, 'store listing is for the mb.io app').toMatch(spec.appId);

    // The App Store answers a phone UA with a 301 to itms-appss://, which the
    // HTTP client cannot follow - the first response is enough to prove the listing exists.
    const listing = await request.get(storeUrl, {
      headers: { 'user-agent': spec.userAgent },
      failOnStatusCode: false,
      maxRedirects: 0,
    });
    expect(listing.status(), `${store} listing ${storeUrl}`).toBeLessThan(400);
  },
);

Then('the hero section text contains {string}', async ({ companyPage }, text: string) => {
  await expect(companyPage.heroSection).toContainText(text, { timeout: env.timeouts.contentLoad });
});

Then('these key figures are displayed:', async ({ companyPage }, table: DataTable) => {
  // Counters may animate up from 0, so toContainText polls until they settle.
  for (const { value, label } of table.hashes() as Array<{ value: string; label: string }>) {
    await expect(companyPage.heroSection, `figure "${value} ${label}"`).toContainText(value, {
      timeout: env.timeouts.contentLoad,
    });
    await expect(companyPage.heroSection).toContainText(label);
  }
});

Then('these content sections are displayed:', async ({ companyPage }, table: DataTable) => {
  for (const { heading, text } of table.hashes() as Array<{ heading: string; text: string }>) {
    const headingLocator = companyPage.heading(heading);
    await headingLocator.scrollIntoViewIfNeeded();
    await expect(headingLocator, `heading "${heading}"`).toBeVisible();
    await expect(companyPage.sectionWithHeading(heading), `text under "${heading}"`).toContainText(text);
  }
});

Then(
  'the {string} section shows these highlights:',
  async ({ companyPage }, sectionHeading: string, table: DataTable) => {
    const section = companyPage.sectionWithHeading(sectionHeading);
    await section.scrollIntoViewIfNeeded();
    await expect(section).toBeVisible();
    for (const { title, text } of table.hashes() as Array<{ title: string; text: string }>) {
      await expect(section.getByText(title, { exact: true }).first(), `highlight "${title}"`).toBeVisible();
      await expect(section, `description of "${title}"`).toContainText(text);
    }
  },
);

Then('the {string} call to action is visible', async ({ companyPage }, name: string) => {
  const cta = companyPage.callToAction(name);
  await cta.scrollIntoViewIfNeeded();
  await expect(cta).toBeVisible();
});
