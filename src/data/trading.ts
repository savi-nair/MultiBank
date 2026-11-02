export interface PairRow {
  index: number;
  symbol: string;
  name: string;
  href: string;
  iconSrc: string;
  iconAlt: string;
  price: string;
  change: string;
  hasChartCell: boolean;
}

/** Category tab label in the UI -> category id in the /market/widget API. */
export const spotCategories: Record<string, string> = {
  Hot: 'hot',
  Gainers: 'gainers',
  Losers: 'losers',
};

export const MIN_VISIBLE_PAIRS = 5;

type FieldValidator = (row: PairRow) => string | null;

/**
 * Field rules referenced by name from the Gherkin data table, so new fields
 * are added here without touching step code.
 */
export const pairFieldValidators: Record<string, FieldValidator> = {
  'uppercase ticker': (r) => (/^[A-Z0-9]{2,12}$/.test(r.symbol) ? null : `symbol "${r.symbol}" is not a ticker`),
  'non-empty text': (r) => (r.name.trim().length > 1 ? null : `name is empty for ${r.symbol}`),
  'image with symbol alt': (r) =>
    r.iconSrc && r.iconAlt.toUpperCase() === r.symbol ? null : `icon missing or alt "${r.iconAlt}" != ${r.symbol}`,
  'USD price': (r) => (/^\$\d{1,3}(,\d{3})*(\.\d+)?$/.test(r.price) ? null : `price "${r.price}" is not a USD amount`),
  percentage: (r) => (/^[-+]?\d+(\.\d+)?%$/.test(r.change) ? null : `change "${r.change}" is not a percentage`),
  '7-day sparkline': (r) => (r.hasChartCell ? null : `no 7-day chart cell for ${r.symbol}`),
  'asset details link': (r) =>
    new RegExp(`/explore/${r.symbol}$`, 'i').test(r.href) ? null : `link "${r.href}" does not target ${r.symbol}`,
};

/** Text that must never be rendered in a market-data cell. */
export const MALFORMED_VALUE = /\b(NaN|undefined|null|Infinity)\b|\$-?\s*$/;
