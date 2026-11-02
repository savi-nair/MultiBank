import type { APIRequestContext } from '@playwright/test';

export type LinkVerdict = 'ok' | 'broken' | 'blocked' | 'skipped';

export interface LinkResult {
  url: string;
  status: number | null;
  method: 'HEAD' | 'GET' | '-';
  verdict: LinkVerdict;
  note?: string;
}

export interface LinkCheckOptions {
  concurrency: number;
  timeout: number;
  /** URLs matching these are not requested at all (mailto:, tel:, chat widgets...). */
  skip: RegExp[];
  /** Hosts that answer automated clients with 401/403/429; reported but not failed. */
  botProtectedHosts: string[];
}

const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';

async function probe(
  request: APIRequestContext,
  url: string,
  method: 'HEAD' | 'GET',
  timeout: number,
): Promise<number> {
  const response = await request.fetch(url, {
    method,
    timeout,
    maxRedirects: 10,
    failOnStatusCode: false,
    headers: { 'user-agent': BROWSER_UA, accept: 'text/html,application/xhtml+xml,*/*' },
  });
  return response.status();
}

async function checkOne(request: APIRequestContext, url: string, opts: LinkCheckOptions): Promise<LinkResult> {
  if (opts.skip.some((pattern) => pattern.test(url))) {
    return { url, status: null, method: '-', verdict: 'skipped', note: 'matches skip list' };
  }

  let status: number | null = null;
  let method: 'HEAD' | 'GET' = 'HEAD';
  let note: string | undefined;

  try {
    status = await probe(request, url, 'HEAD', opts.timeout);
    // Many servers/CDNs don't implement HEAD properly - confirm with GET.
    if (status >= 400) {
      method = 'GET';
      status = await probe(request, url, 'GET', opts.timeout);
    }
  } catch (error) {
    try {
      method = 'GET';
      status = await probe(request, url, 'GET', opts.timeout);
    } catch (retryError) {
      note = (retryError as Error).message.split('\n')[0];
    }
  }

  const host = new URL(url).hostname;
  const protectedHost = opts.botProtectedHosts.some((h) => host === h || host.endsWith(`.${h}`));

  let verdict: LinkVerdict;
  if (status !== null && status < 400) verdict = 'ok';
  else if (status !== null && protectedHost && [401, 403, 429].includes(status)) verdict = 'blocked';
  else verdict = 'broken';

  return { url, status, method, verdict, note };
}

/** Checks links with bounded concurrency; never throws, returns a verdict per URL. */
export async function checkLinks(
  request: APIRequestContext,
  urls: string[],
  opts: LinkCheckOptions,
): Promise<LinkResult[]> {
  const queue = [...new Set(urls)];
  const results: LinkResult[] = [];

  const worker = async () => {
    for (let url = queue.shift(); url !== undefined; url = queue.shift()) {
      results.push(await checkOne(request, url, opts));
    }
  };

  await Promise.all(Array.from({ length: Math.max(1, opts.concurrency) }, worker));
  return results.sort((a, b) => a.url.localeCompare(b.url));
}

export function formatLinkReport(results: LinkResult[]): string {
  const rows = results.map(
    (r) => `| ${r.verdict.toUpperCase()} | ${r.status ?? '-'} | ${r.method} | ${r.url} | ${r.note ?? ''} |`,
  );
  return ['| Verdict | Status | Method | URL | Note |', '|---|---|---|---|---|', ...rows].join('\n');
}
