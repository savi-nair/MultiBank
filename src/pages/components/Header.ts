import type { Locator, Page } from '@playwright/test';

/** The sticky site header: logo, primary nav, account CTAs and menu button. */
export class Header {
  readonly root: Locator;
  readonly desktopNav: Locator;
  readonly logo: Locator;
  readonly menuButton: Locator;

  constructor(private readonly page: Page) {
    this.root = page.locator('header').first();
    this.desktopNav = this.root.locator('nav').first();
    this.logo = this.root.getByRole('link').first();
    this.menuButton = this.root.getByRole('button', { name: /open menu/i });
  }

  navLink(label: string): Locator {
    return this.desktopNav.getByRole('link', { name: label, exact: true });
  }

  /** Any header link (nav items and CTAs such as Sign in / Sign up). */
  link(label: string): Locator {
    return this.root.getByRole('link', { name: label, exact: true }).first();
  }

  async navLabels(): Promise<string[]> {
    const texts = await this.desktopNav.getByRole('link').allInnerTexts();
    return texts.map((t) => t.trim()).filter(Boolean);
  }

  async absoluteHrefs(): Promise<string[]> {
    return this.root.locator('a[href]').evaluateAll((links) => links.map((a) => (a as HTMLAnchorElement).href));
  }
}
