import type { APIRequestContext } from '@playwright/test';

export interface RedirectHop {
  url: string;
  status: number | null;
}

export interface StoreResolution {
  finalUrl: string;
  chain: RedirectHop[];
}

const STORE_URL_IN_BODY =
  /(?:https?|itms-apps|market):\/\/(?:apps\.apple\.com|itunes\.apple\.com|play\.google\.com|details)[^"'\s<>\\]*/i;

/**
 * Resolves a smart/deferred deep link (e.g. *.go.link) the way a phone would:
 * follows HTTP redirects hop by hop with a device user agent, stops at
 * non-HTTP schemes (itms-apps://, market://) and, if the provider uses a JS
 * redirect page instead of a 3xx, extracts the store URL from the HTML.
 */
export async function resolveStoreLink(
  request: APIRequestContext,
  startUrl: string,
  userAgent: string,
  maxHops = 10,
): Promise<StoreResolution> {
  const chain: RedirectHop[] = [];
  let current = startUrl;

  for (let hop = 0; hop < maxHops; hop++) {
    if (!/^https?:/i.test(current)) {
      chain.push({ url: current, status: null });
      return { finalUrl: current, chain };
    }

    const response = await request.get(current, {
      maxRedirects: 0,
      failOnStatusCode: false,
      headers: { 'user-agent': userAgent, accept: 'text/html,*/*' },
    });
    chain.push({ url: current, status: response.status() });

    const location = response.headers()['location'];
    if (response.status() >= 300 && response.status() < 400 && location) {
      current = new URL(location, current).toString();
      continue;
    }

    if (/apps\.apple\.com|itunes\.apple\.com|play\.google\.com/i.test(new URL(current).hostname)) {
      return { finalUrl: current, chain };
    }

    const match = (await response.text()).replace(/&amp;/g, '&').match(STORE_URL_IN_BODY);
    if (match) {
      current = match[0];
      continue;
    }
    return { finalUrl: current, chain };
  }

  return { finalUrl: current, chain };
}

/**
 * Maps app-opening schemes to the https store listing so it can be verified:
 * itms-apps(s)://apps.apple.com/... -> https://apps.apple.com/...,
 * market://details?... -> https://play.google.com/store/apps/details?...,
 * intent://...#Intent;...;S.browser_fallback_url=<encoded>;end -> the fallback URL.
 */
export function toHttpStoreUrl(url: string): string {
  if (/^intent:/i.test(url)) {
    const fallback = url.match(/;S\.browser_fallback_url=([^;]+)/i)?.[1];
    if (fallback) return toHttpStoreUrl(decodeURIComponent(fallback));
  }
  return url.replace(/^itms-apps{1,2}:\/\//i, 'https://').replace(/^market:\/\/details/i, 'https://play.google.com/store/apps/details');
}
