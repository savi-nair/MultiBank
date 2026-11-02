import { allOf, array, boolean, decimalString, formattedMatches, number, object, string, url, type Rule } from './schema';

/**
 * Response contracts for the public market-data endpoints, derived from what
 * the mb.io pages consume. Required fields must be present with the right type
 * and format; optional fields are format-checked only when present.
 */
const assetCode = () => string({ pattern: /^[A-Z0-9]{1,12}$/ });
const byCode = (item: unknown, i: number) => (item as { code?: string })?.code ?? String(i);
const byPair = (item: unknown, i: number) => {
  const t = item as { base?: string; quote?: string };
  return t?.base && t?.quote ? `${t.base}/${t.quote}` : String(i);
};

export const instrumentSchema: Rule = object(
  {
    code: assetCode(),
    symbol: string({ nonEmpty: true }),
    type: string({ pattern: /^(crypto|fiat)$/ }),
    tradeEnabled: boolean(),
    precision: number({ integer: true, min: 0 }),
    image: url(),
    tags: array(string({ nonEmpty: true })),
  },
  {
    // Optional: the API omits it for some instruments (e.g. USD, ENA). Checked when present.
    displayName: string({ nonEmpty: true }),
    url: url(),
    makerFee: number({ min: 0 }),
    takerFee: number({ min: 0 }),
    rank: number({ integer: true, min: 1 }),
  },
);

export const marketCategorySchema: Rule = object({
  id: string({ pattern: /^[a-z0-9-]+$/ }),
  name: string({ nonEmpty: true }),
  highlighted: array(assetCode()),
  items: array(assetCode(), { minItems: 1 }),
});

export const priceTickSchema: Rule = allOf(
  object(
    {
      base: assetCode(),
      quote: assetCode(),
      timestamp: number({ integer: true, min: 1_500_000_000 }),
      open: number(),
      close: number(),
      high: number(),
      low: number(),
      openFormatted: decimalString(),
      closeFormatted: decimalString(),
      highFormatted: decimalString(),
      lowFormatted: decimalString(),
      changePercentFormatted: string({ pattern: /^-?\d+\.\d{2}$/ }),
    },
    { inverted: boolean(), triangulated: boolean(), change: number(), changePercent: number(), source: string({ nonEmpty: true }) },
  ),
  formattedMatches(['open', 'close', 'high', 'low']),
);

export const responseSchemas = {
  instruments: array(instrumentSchema, { minItems: 1, key: byCode }),
  widget: array(marketCategorySchema, { minItems: 1, key: (item, i) => (item as { id?: string })?.id ?? String(i) }),
  prices: array(priceTickSchema, { minItems: 1, key: byPair }),
} as const;

export type ApiEndpoint = keyof typeof responseSchemas;
