import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';
import * as os from 'node:os';
import { env } from './src/config/env';

/**
 * Gherkin features are compiled by playwright-bdd into Playwright specs, so we
 * get Cucumber-style scenarios AND Playwright's runner: parallelism, projects,
 * retries, traces and fixtures.
 */
const testDir = defineBddConfig({
  features: 'features/**/*.feature',
  steps: ['src/fixtures/*.ts', 'src/steps/**/*.ts'],
});

const desktopViewport = { width: 1440, height: 900 };

export default defineConfig({
  testDir,
  timeout: env.timeouts.test,
  expect: { timeout: env.timeouts.expect },
  fullyParallel: true,
  forbidOnly: env.ci,
  retries: env.retries ?? (env.ci ? 2 : 0),
  workers: env.workers ?? (env.ci ? 2 : undefined),
  outputDir: 'test-results',

  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    [
      'allure-playwright',
      {
        resultsDir: 'allure-results',
        detail: true,
        suiteTitle: true,
        environmentInfo: {
          base_url: env.baseURL,
          locale: env.locale || 'auto (geo redirect)',
          node: process.version,
          os: `${os.platform()} ${os.release()}`,
        },
      },
    ],
    ...(env.ci ? ([['github']] as const) : []),
  ],

  use: {
    baseURL: env.baseURL,
    headless: env.headless,
    navigationTimeout: env.timeouts.navigation,
    actionTimeout: env.timeouts.action,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    locale: 'en-US',
    ignoreHTTPSErrors: false,
  },

  projects: [
    {
      name: 'desktop-chromium',
      use: { ...devices['Desktop Chrome'], viewport: desktopViewport },
    },
    ...(process.env.CROSS_BROWSER
      ? [
          {
            name: 'desktop-firefox',
            grepInvert: /@api/,
            use: { ...devices['Desktop Firefox'], viewport: desktopViewport },
          },
          {
            name: 'desktop-webkit',
            grepInvert: /@api/,
            use: { ...devices['Desktop Safari'], viewport: desktopViewport },
          },
        ]
      : []),
  ],
});
