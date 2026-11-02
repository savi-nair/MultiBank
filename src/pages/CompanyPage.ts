import type { Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/** /company - the "Why MultiBank Group?" (About Us) page. */
export class CompanyPage extends BasePage {
  sectionWithHeading(heading: string): Locator {
    return this.page
      .locator('section')
      .filter({ has: this.page.getByRole('heading', { name: heading, exact: true }) })
      .first();
  }

  heading(text: string): Locator {
    return this.page.getByRole('heading', { name: text, exact: true });
  }

  get heroSection(): Locator {
    return this.page.locator('section').filter({ has: this.mainHeading }).first();
  }

  callToAction(name: string): Locator {
    return this.page.getByRole('link', { name, exact: true }).or(this.page.getByRole('button', { name, exact: true })).first();
  }
}
