import type { Locator, Page, Response } from '@playwright/test';
import { localizedPath } from '../support/url';
import { Footer } from './components/Footer';
import { Header } from './components/Header';

/** Behaviour every mb.io page shares: header, footer, navigation helpers. */
export class BasePage {
  readonly header: Header;
  readonly footer: Footer;

  constructor(readonly page: Page) {
    this.header = new Header(page);
    this.footer = new Footer(page);
  }

  /** Navigates to a locale-less path; the site's own locale redirect is followed. */
  async open(path: string): Promise<Response | null> {
    return this.page.goto(localizedPath(path), { waitUntil: 'domcontentloaded' });
  }

  get mainHeading(): Locator {
    return this.page.locator('h1').first();
  }

  async horizontalOverflow(): Promise<number> {
    return this.page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  }

  /** Scrolls through the page so lazy-loaded media/components are requested. */
  async scrollThrough(step = 600): Promise<void> {
    await this.page.evaluate(async (delta) => {
      for (let y = 0; y < document.body.scrollHeight; y += delta) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 120));
      }
      window.scrollTo(0, 0);
    }, step);
  }

  async brokenImages(scope: Locator = this.page.locator('main, body').first()): Promise<string[]> {
    return scope.locator('img').evaluateAll((imgs) =>
      (imgs as HTMLImageElement[])
        .filter((img) => img.getBoundingClientRect().width > 0 && (!img.complete || img.naturalWidth === 0))
        .map((img) => img.currentSrc || img.src || img.alt),
    );
  }
}
