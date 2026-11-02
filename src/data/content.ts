export interface StorePlatform {
  userAgent: string;
  /** Host the deep link must resolve to. */
  storeHost: RegExp;
  /** App identity in the store URL. */
  appId: RegExp;
}

export const appStores: Record<string, StorePlatform> = {
  iOS: {
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
    storeHost: /(apps|itunes)\.apple\.com/i,
    appId: /\/id\d+/,
  },
  Android: {
    userAgent:
      'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36',
    storeHost: /play\.google\.com/i,
    appId: /id=com\.multibank\.app\b/,
  },
};

/** Store display names used in Gherkin -> platform key above. */
export const storeToPlatform: Record<string, keyof typeof appStores> = {
  'App Store': 'iOS',
  'Google Play': 'Android',
};
