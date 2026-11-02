import type { Locator, Page } from '@playwright/test';

export class Footer {
  readonly root: Locator;

  constructor(page: Page) {
    this.root = page.locator('footer').last();
  }

  async absoluteHrefs(): Promise<string[]> {
    await this.root.scrollIntoViewIfNeeded();
    return this.root.locator('a[href]').evaluateAll((links) => links.map((a) => (a as HTMLAnchorElement).href));
  }
}
