import { env } from '../config/env';

/** Optional locale segment the site may insert, e.g. /en-AE or /ar. */
export const LOCALE_SEGMENT = String.raw`(?:/[a-z]{2}(?:-[A-Za-z]{2,4})?)?`;

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Builds a navigable path, prefixing the configured locale when one is set. */
export function localizedPath(path: string): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  if (!env.locale) return clean;
  return clean === '/' ? `/${env.locale}` : `/${env.locale}${clean}`;
}

/** Matches a pathname regardless of the locale prefix the site chose. */
export function pathMatcher(path: string): RegExp {
  if (path === '/') return new RegExp(`^${LOCALE_SEGMENT}/?$`);
  return new RegExp(`^${LOCALE_SEGMENT}${escapeRegExp(path)}/?$`);
}

export function pathnameOf(url: string): string {
  return new URL(url, env.baseURL).pathname;
}

export function isSameSite(url: string): boolean {
  const host = new URL(url, env.baseURL).hostname;
  const base = new URL(env.baseURL).hostname;
  return host === base || host === `www.${base}`;
}

export function uniqueSuffix(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}
