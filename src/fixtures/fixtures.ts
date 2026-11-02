import { test as base, createBdd } from 'playwright-bdd';
import { BasePage } from '../pages/BasePage';
import { CompanyPage } from '../pages/CompanyPage';
import { ExplorePage } from '../pages/ExplorePage';
import { ApiClient } from '../support/apiClient';
import { ScenarioContext } from '../support/scenarioContext';

type Fixtures = {
  ctx: ScenarioContext;
  sitePage: BasePage;
  explorePage: ExplorePage;
  companyPage: CompanyPage;
  api: ApiClient;
};

export const test = base.extend<Fixtures>({
  ctx: async ({}, use) => {
    await use(new ScenarioContext());
  },

  /**
   * Page hardening shared by every UI scenario:
   *  - records uncaught JS errors (asserted by some scenarios, always attached)
   *  - auto-dismisses a cookie/consent banner if one appears, choosing the
   *    privacy-preserving option, so it can never intercept clicks.
   */
  page: async ({ page, ctx }, use, testInfo) => {
    page.on('pageerror', (error) => ctx.pageErrors.push(error.message));

    await page.addLocatorHandler(
      page.getByRole('button', { name: /^(reject all|reject|decline|only necessary|necessary only)$/i }),
      async (button) => {
        await button.click();
      },
      { noWaitAfter: true },
    );

    await use(page);

    if (ctx.pageErrors.length) {
      await testInfo.attach('uncaught-page-errors', {
        body: ctx.pageErrors.join('\n\n'),
        contentType: 'text/plain',
      });
    }
  },

  sitePage: async ({ page }, use) => use(new BasePage(page)),
  explorePage: async ({ page }, use) => use(new ExplorePage(page)),
  companyPage: async ({ page }, use) => use(new CompanyPage(page)),
  api: async ({ request }, use) => use(new ApiClient(request)),
});

export const { Given, When, Then, Before, After } = createBdd(test);
