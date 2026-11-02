import { expect } from '@playwright/test';
import { DataTable } from 'playwright-bdd';
import { env } from '../config/env';
import { botProtectedHosts, linkSkipList } from '../data/links';
import { findHeaderLink } from '../data/navigation';
import { Then, When } from '../fixtures/fixtures';
import { checkLinks } from '../support/linkChecker';
import { pathMatcher } from '../support/url';
import { column } from './common.steps';

Then('the top navigation displays these items in order:', async ({ sitePage }, table: DataTable) => {
  const expected = column(table);
  for (const label of expected) {
    await expect(sitePage.header.navLink(label), `nav item "${label}"`).toBeVisible();
  }
  const rendered = await sitePage.header.navLabels();
  expect(rendered, 'navigation items and their order').toEqual(expected);
});

Then('the header shows the {string} and {string} actions', async ({ sitePage }, first: string, second: string) => {
  await expect(sitePage.header.link(first)).toBeVisible();
  await expect(sitePage.header.link(second)).toBeVisible();
});

Then('the header logo links to the homepage', async ({ sitePage }) => {
  const href = await sitePage.header.logo.getAttribute('href');
  expect(href).not.toBeNull();
  const url = new URL(href!, env.baseURL);
  expect(url.hostname.endsWith('mb.io'), `logo host ${url.hostname}`).toBeTruthy();
  expect(url.pathname).toMatch(pathMatcher('/'));
});

When('I select {string} in the top navigation', async ({ sitePage }, label: string) => {
  await sitePage.header.navLink(label).click();
});

Then('I land on the destination configured for {string}', async ({ page, sitePage }, label: string) => {
  const item = findHeaderLink(label);
  expect(item.kind, `"${label}" is not an internal destination`).toBe('internal');

  await page.waitForURL((url) => pathMatcher(item.path!).test(url.pathname));
  await expect(page).toHaveTitle(item.title ?? /\S/);
  await expect(sitePage.header.root).toBeVisible();
  if (item.heading) {
    await expect(sitePage.mainHeading).toHaveText(item.heading, { timeout: env.timeouts.contentLoad });
  }
});

Then('the header link {string} points to its configured destination', async ({ sitePage }, label: string) => {
  const item = findHeaderLink(label);
  const link = sitePage.header.link(label);
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute('href', item.href!);
});

Then(
  'the destination of header link {string} responds successfully',
  async ({ request, sitePage, $testInfo: testInfo }, label: string) => {
    const href = await sitePage.header.link(label).evaluate((a) => (a as HTMLAnchorElement).href);
    const [result] = await checkLinks(request, [href], {
      concurrency: 1,
      timeout: env.linkCheck.timeout,
      skip: linkSkipList,
      botProtectedHosts,
    });
    if (result.verdict === 'blocked') {
      testInfo.annotations.push({
        type: 'warning',
        description: `${href} answered ${result.status} to an automated client (bot protection)`,
      });
    }
    expect(result.verdict, `${href} -> ${result.status ?? result.note}`).not.toBe('broken');
  },
);

Then('the desktop navigation is fully visible on a single row', async ({ sitePage }) => {
  const nav = sitePage.header.desktopNav;
  await expect(nav).toBeVisible();
  const links = nav.getByRole('link');
  const count = await links.count();
  expect(count).toBeGreaterThan(0);

  const centres: number[] = [];
  for (let i = 0; i < count; i++) {
    await expect(links.nth(i)).toBeInViewport({ ratio: 1 });
    const box = (await links.nth(i).boundingBox())!;
    centres.push(box.y + box.height / 2);
  }
  const spread = Math.max(...centres) - Math.min(...centres);
  expect(spread, 'nav items wrapped onto multiple rows (vertical spread px)').toBeLessThanOrEqual(6);
});

Then('the mobile menu button is hidden', async ({ sitePage }) => {
  await expect(sitePage.header.menuButton).toBeHidden();
});

