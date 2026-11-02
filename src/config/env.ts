import * as dotenv from 'dotenv';

dotenv.config();

const num = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const bool = (value: string | undefined, fallback: boolean): boolean =>
  value === undefined ? fallback : ['1', 'true', 'yes'].includes(value.toLowerCase());

/**
 * Single source of runtime configuration. Everything that differs between
 * environments (URLs, locale, timeouts) is read from env vars / .env so the
 * same suite can target staging, production or another region unchanged.
 */
export const env = {
  /** Public site. trade.multibank.io now redirects to the rebranded mb.io. */
  baseURL: (process.env.BASE_URL ?? 'https://mb.io').replace(/\/$/, ''),
  /** Legacy domain from the original brief, used for the redirect check. */
  legacyURL: (process.env.LEGACY_URL ?? 'https://trade.multibank.io').replace(/\/$/, ''),
  /**
   * Optional locale segment, e.g. "en-AE". Empty = let the site geo-redirect.
   * Assertions are locale-agnostic either way.
   */
  locale: process.env.LOCALE ?? '',
  coreApiURL: (process.env.CORE_API_URL ?? 'https://core-api.mb.io/api/io/v1').replace(/\/$/, ''),
  marketDataApiURL: (
    process.env.MARKET_DATA_API_URL ?? 'https://mbg-market-data-service.mb.io/api/io/v1'
  ).replace(/\/$/, ''),

  ci: bool(process.env.CI, false),
  /** Headed locally so runs are visible; stays headless on CI unless HEADLESS is set. */
  headless: bool(process.env.HEADLESS, bool(process.env.CI, false)),
  workers: process.env.WORKERS ? num(process.env.WORKERS, 2) : undefined,
  retries: process.env.RETRIES !== undefined ? Number(process.env.RETRIES) : undefined,

  timeouts: {
    test: num(process.env.TEST_TIMEOUT_MS, 90_000),
    navigation: num(process.env.NAVIGATION_TIMEOUT_MS, 45_000),
    action: num(process.env.ACTION_TIMEOUT_MS, 15_000),
    expect: num(process.env.EXPECT_TIMEOUT_MS, 15_000),
    /** Budget for async content (market data tables etc.) to appear. */
    contentLoad: num(process.env.CONTENT_LOAD_TIMEOUT_MS, 20_000),
    /** Max acceptable API latency in the API checks. */
    apiLatency: num(process.env.API_LATENCY_BUDGET_MS, 3_000),
  },

  linkCheck: {
    concurrency: num(process.env.LINK_CHECK_CONCURRENCY, 6),
    timeout: num(process.env.LINK_CHECK_TIMEOUT_MS, 20_000),
  },
} as const;
