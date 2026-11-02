import type { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { SpotMarket } from './components/SpotMarket';

export class ExplorePage extends BasePage {
  readonly spotMarket: SpotMarket;

  constructor(page: Page) {
    super(page);
    this.spotMarket = new SpotMarket(page);
  }

  /** Promo card identified by its title text (e.g. "Earn interest on your assets"). */
  banner(title: string): Locator {
    return this.page
      .locator('div')
      .filter({ has: this.page.getByText(title, { exact: true }) })
      .filter({ hasNotText: /Spot market/i })
      .last();
  }

  downloadAppLink(name: string | RegExp): Locator {
    return this.page.getByRole('link', { name }).first();
  }
}
