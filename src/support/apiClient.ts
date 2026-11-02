import type { APIRequestContext, APIResponse } from '@playwright/test';
import { env } from '../config/env';
import type { ApiEndpoint } from './apiSchemas';

export interface Instrument {
  code: string;
  displayName?: string;
  symbol: string;
  type: string;
  tradeEnabled: boolean;
  image?: string;
  tags?: string[];
}

export interface MarketCategory {
  id: string;
  name: string;
  highlighted: string[];
  items: string[];
}

export interface PriceTick {
  base: string;
  quote: string;
  open: number;
  close: number;
  high: number;
  low: number;
  changePercentFormatted: string;
  timestamp: number;
  /** Quote derived by inverting the opposite pair (e.g. USDC/USDT from USDT/USDC). */
  inverted?: boolean;
}

export interface TimedResponse<T> {
  response: APIResponse;
  body: T;
  /** Raw response text, kept so syntax errors can be reported verbatim. */
  text: string;
  /** Set when the body is not valid JSON; `body` then holds the raw text. */
  jsonError?: string;
  durationMs: number;
}

/**
 * Thin typed client for the public, unauthenticated market-data endpoints the
 * mb.io pages call. Used both for API tests and as a test oracle for the UI.
 */
export class ApiClient {
  constructor(private readonly request: APIRequestContext) {}

  private async timedGet<T>(url: string): Promise<TimedResponse<T>> {
    const started = Date.now();
    const response = await this.request.get(url, {
      failOnStatusCode: false,
      headers: { accept: 'application/json', origin: env.baseURL, referer: `${env.baseURL}/` },
    });
    const durationMs = Date.now() - started;
    const text = await response.text();
    try {
      return { response, body: JSON.parse(text) as T, text, durationMs };
    } catch (error) {
      return { response, body: text as unknown as T, text, jsonError: (error as Error).message, durationMs };
    }
  }

  instruments() {
    return this.timedGet<Instrument[]>(`${env.coreApiURL}/market/instruments`);
  }

  marketWidget() {
    return this.timedGet<MarketCategory[]>(`${env.coreApiURL}/market/widget`);
  }

  prices(quote = 'USDT') {
    return this.timedGet<PriceTick[]>(`${env.marketDataApiURL}/marketdata/prices?quote=${encodeURIComponent(quote)}`);
  }

  get(endpoint: ApiEndpoint) {
    switch (endpoint) {
      case 'instruments':
        return this.instruments();
      case 'widget':
        return this.marketWidget();
      case 'prices':
        return this.prices();
    }
  }
}
