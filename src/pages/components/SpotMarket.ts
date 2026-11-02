import type { Locator, Page } from '@playwright/test';
import type { PairRow } from '../../data/trading';

/**
 * "Spot market" widget on /explore: category tabs (Hot / Gainers / Losers)
 * above a table whose cells carry stable ids: *_displayName-td,
 * *_price-td, *_change-td and *_week-chart-td.
 */
export class SpotMarket {
  readonly heading: Locator;
  readonly section: Locator;
  readonly table: Locator;
  readonly rows: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { name: /spot market/i });
    this.table = page.locator('table').filter({ has: page.locator('td[id$="_displayName-td"]') }).first();
    // Innermost container that holds both the heading and the table.
    this.section = page.locator('section, div').filter({ has: this.heading }).filter({ has: this.table }).last();
    this.rows = this.table.locator('tr').filter({ has: page.locator('td[id$="_displayName-td"]') });
  }

  category(label: string): Locator {
    return this.section.getByRole('button', { name: label, exact: true });
  }

  async selectCategory(label: string): Promise<void> {
    const before = await this.symbols().catch(() => [] as string[]);
    await this.category(label).click();
    // Wait for the table to re-render (row set changes) - best effort, the
    // category might legitimately contain the same leading pairs.
    await this.page
      .waitForFunction(
        (prev) => {
          const cells = [...document.querySelectorAll('td[id$="_displayName-td"] span:first-child')];
          return cells.map((c) => c.textContent?.trim()).join(',') !== prev;
        },
        before.join(','),
        { timeout: 5_000 },
      )
      .catch(() => undefined);
  }

  async readRows(): Promise<PairRow[]> {
    return this.rows.evaluateAll((trs) =>
      trs.map((tr, index) => {
        const nameCell = tr.querySelector('td[id$="_displayName-td"]');
        const spans = nameCell ? [...nameCell.querySelectorAll('span')] : [];
        const link = nameCell?.querySelector('a');
        const img = nameCell?.querySelector('img');
        // Price and 24h change used to share one *_Price-td cell; they now
        // live in *_price-td and *_change-td. Read both so either layout works.
        const priceCell = tr.querySelector('td[id$="_price-td" i]') as HTMLElement | null;
        const changeCell = tr.querySelector('td[id$="_change-td" i]') as HTMLElement | null;
        const priceParts = [priceCell?.innerText ?? '', changeCell?.innerText ?? '']
          .join('\n')
          .split('\n')
          .map((t) => t.trim())
          .filter(Boolean);
        return {
          index,
          symbol: spans[0]?.textContent?.trim() ?? '',
          name: spans[1]?.textContent?.trim() ?? '',
          href: link?.getAttribute('href') ?? '',
          iconSrc: img?.getAttribute('src') ?? '',
          iconAlt: img?.getAttribute('alt') ?? '',
          price: priceParts.find((t) => t.startsWith('$') || t.startsWith('-$')) ?? priceParts[0] ?? '',
          change: priceParts.find((t) => t.endsWith('%')) ?? '',
          hasChartCell: !!tr.querySelector('td[id$="_week-chart-td"]'),
        };
      }),
    );
  }

  async symbols(): Promise<string[]> {
    return (await this.readRows()).map((r) => r.symbol);
  }

  async cellTexts(): Promise<string[]> {
    return this.table.locator('td').allInnerTexts();
  }
}
