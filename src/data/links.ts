/** Links that must not be requested by the broken-link checker. */
export const linkSkipList: RegExp[] = [
  /^mailto:/i,
  /^tel:/i,
  /^javascript:/i,
  /^#/,
  /livechatinc\.com/i,
];

/**
 * Third-party hosts known to challenge automated clients (Cloudflare etc).
 * 401/403/429 from these is reported as "blocked", not "broken".
 */
export const botProtectedHosts: string[] = ['hacken.io', 'multibankgroup.com', 'trade.mb.io'];

/** Route fragments intercepted by the content-timeout scenarios. */
export const marketDataRoutes: RegExp[] = [/\/market\/widget/, /\/market\/instruments/, /\/marketdata\/prices/];

export const thirdPartyChatRoutes: RegExp[] = [/livechatinc\.com/, /cdn\.livechat/];

/** Text that indicates an unhandled server/app error leaked to the user. */
export const serverErrorText =
  /Internal Server Error|Application error|Unhandled Runtime Error|Traceback|Exception:|at [A-Za-z]+ \(.*:\d+:\d+\)/;
