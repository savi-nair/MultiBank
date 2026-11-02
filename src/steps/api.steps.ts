import { expect } from '@playwright/test';
import { DataTable } from 'playwright-bdd';
import { env } from '../config/env';
import { Then, When } from '../fixtures/fixtures';
import type { Instrument, MarketCategory, PriceTick, TimedResponse } from '../support/apiClient';
import { responseSchemas, type ApiEndpoint } from '../support/apiSchemas';
import { validate } from '../support/schema';
import { column } from './common.steps';

const API_KEY = 'apiResult';

const last = <T>(ctx: { data: Map<string, unknown> }) => {
  const result = ctx.data.get(API_KEY) as TimedResponse<T> | undefined;
  if (!result) throw new Error('No API call made in this scenario - call "I call the ... market API" first');
  return result;
};

When('I call the {string} market API', async ({ api, ctx, $testInfo: testInfo }, endpoint: string) => {
  if (!(endpoint in responseSchemas)) throw new Error(`Unknown endpoint "${endpoint}"`);
  const result = await api.get(endpoint as ApiEndpoint);
  ctx.data.set(API_KEY, result);
  ctx.data.set('apiEndpoint', endpoint);
  await testInfo.attach(`${endpoint}-response.json`, {
    body: JSON.stringify(
      { url: result.response.url(), status: result.response.status(), ms: result.durationMs, sample: Array.isArray(result.body) ? result.body.slice(0, 3) : result.body },
      null,
      2,
    ),
    contentType: 'application/json',
  });
});

Then('the API responds with status 200 and a JSON list', async ({ ctx }) => {
  const { response, body, text, jsonError } = last<unknown[]>(ctx);
  expect(response.status(), response.url()).toBe(200);
  expect(response.headers()['content-type'] ?? '').toContain('application/json');
  expect(jsonError, `body is not valid JSON: ${text.slice(0, 200)}`).toBeUndefined();
  expect(Array.isArray(body), 'body is a JSON array').toBeTruthy();
  expect(body.length).toBeGreaterThan(0);
});

Then('every record matches the {string} response schema', async ({ ctx, $testInfo: testInfo }, endpoint: string) => {
  expect(ctx.data.get('apiEndpoint'), 'schema must match the endpoint called').toBe(endpoint);
  const { body } = last<unknown>(ctx);
  const violations = validate(responseSchemas[endpoint as ApiEndpoint], body);
  if (violations.length) {
    await testInfo.attach(`${endpoint}-schema-violations.txt`, { body: violations.join('\n'), contentType: 'text/plain' });
  }
  expect(violations, `${endpoint} schema violations`).toEqual([]);
});

Then('the API responds within the latency budget', async ({ ctx }) => {
  const { durationMs, response } = last<unknown>(ctx);
  expect(durationMs, `${response.url()} latency (ms)`).toBeLessThanOrEqual(env.timeouts.apiLatency);
});

Then('the instruments include these assets:', async ({ ctx }, table: DataTable) => {
  const codes = last<Instrument[]>(ctx).body.map((i) => i.code);
  for (const code of column(table)) expect(codes, `instrument ${code}`).toContain(code);
});

Then('the market widget contains the categories:', async ({ ctx }, table: DataTable) => {
  const categories = last<MarketCategory[]>(ctx).body;
  const ids = categories.map((c) => c.id);
  for (const id of column(table)) {
    expect(ids, `category ${id}`).toContain(id);
    const category = categories.find((c) => c.id === id)!;
    expect(category.items.length, `${id} has items`).toBeGreaterThan(0);
    expect(typeof category.name).toBe('string');
  }
});

Then('every category only references known instruments', async ({ ctx, api }) => {
  const categories = last<MarketCategory[]>(ctx).body;
  const known = new Set((await api.instruments()).body.map((i) => i.code));
  const unknown = categories.flatMap((c) =>
    [...c.items, ...c.highlighted].filter((code) => !known.has(code)).map((code) => `${c.id}:${code}`),
  );
  expect(unknown, 'category entries without an instrument').toEqual([]);
});

Then(
  'every price tick is quoted in {string} with a positive close between its low and high',
  async ({ ctx }, quote: string) => {
    const ticks = last<PriceTick[]>(ctx).body;
    const tolerance = 1e-6;
    const describe = (t: PriceTick) => `${t.base}/${t.quote} low=${t.low} close=${t.close} high=${t.high}`;
    const inRange = (close: number, low: number, high: number) =>
      close >= low * (1 - tolerance) && close <= high * (1 + tolerance);

    const problems = ticks.flatMap((t) => {
      const reasons = [
        t.quote !== quote && `quoted in ${t.quote}`,
        !(t.close > 0) && 'close is not positive',
        t.high < t.low && 'high is below low',
        t.high >= t.low && !inRange(t.close, t.low, t.high) && 'close is outside low..high',
      ].filter(Boolean);
      return reasons.length ? [`${describe(t)}: ${reasons.join(', ')}`] : [];
    });
    expect(problems, 'inconsistent price ticks').toEqual([]);
  },
);

When('I request the legacy platform URL', async ({ request, ctx }) => {
  const response = await request.get(env.legacyURL, { maxRedirects: 10, failOnStatusCode: false });
  ctx.data.set('legacy', { status: response.status(), finalUrl: response.url() });
});

Then('the legacy platform resolves or redirects to an mb.io host', async ({ ctx, $testInfo: testInfo }) => {
  const { status, finalUrl } = ctx.data.get('legacy') as { status: number; finalUrl: string };
  const host = new URL(finalUrl).hostname;
  testInfo.annotations.push({ type: 'legacy-final-url', description: `${status} ${finalUrl}` });
  expect(status, finalUrl).toBeLessThan(400);
  // The rebrand is rolled out per region: some regions are redirected to
  // trade.mb.io, others are still served the legacy exchange.
  expect(host, 'unexpected final host').toMatch(/(^|\.)mb\.io$|^trade\.multibank\.io$/);
});
