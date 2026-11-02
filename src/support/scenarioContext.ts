import type { Response } from '@playwright/test';
import type { MarketCategory } from './apiClient';

/**
 * Per-scenario scratch space shared between steps (the Cucumber "World").
 * A fresh instance is created for every scenario by the `ctx` fixture.
 */
export class ScenarioContext {
  lastResponse: Response | null = null;
  /** Market widget payload captured from the page's own network traffic. */
  marketWidget: MarketCategory[] | null = null;
  rememberedPairs = new Map<string, string[]>();
  pageErrors: string[] = [];
  data = new Map<string, unknown>();
}
