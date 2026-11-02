# mb.io E2E Test Framework

BDD end-to-end suite for **mb.io** (the rebrand of `trade.multibank.io`), built with
**Playwright**, **playwright-bdd** (Cucumber/Gherkin) and **Allure**. It runs on Chromium,
Firefox and WebKit and validates the public market-data API.

## Run it

Requires Node 20 or later.

```bash
npm run e2e
```

That one command installs dependencies and browsers, then runs the full suite on all three
browsers. On Linux, install the browsers' system libraries first with
`npx playwright install-deps`.

Reports:

```bash
npm run report:html     # Playwright HTML report
npm run report:allure   # Allure report (needs Java)
```

## Deliverables

| Deliverable | Where |
| --- | --- |
| Test suite (Task 1) | `features/`, `src/` |
| Sample execution report and cross-browser evidence | [docs/reports/2026-11-02-cross-browser](docs/reports/2026-11-02-cross-browser/README.md) |
| Written responses to Task 2 | [docs/task2-qa-approach.md](docs/task2-qa-approach.md) |
| Test plan | [docs/test-plan.md](docs/test-plan.md) |
| Release readiness checklist | [docs/release-readiness-checklist.md](docs/release-readiness-checklist.md) |
| Risk matrix | [docs/risk-matrix.md](docs/risk-matrix.md) |
| Framework and design decisions | [below](#design-decisions) |
| Assumptions | [below](#assumptions) |
| CI pipeline | [.github/workflows/e2e.yml](.github/workflows/e2e.yml) |

## Latest results

**104 tests: 101 passed, 3 failed** on 2 November 2026 ([full report](docs/reports/2026-11-02-cross-browser/README.md)).

| Browser | Tests | Passed | Failed |
| --- | --- | --- | --- |
| Chromium | 38 | 38 | 0 |
| Firefox | 33 | 32 | 1 |
| WebKit | 33 | 31 | 2 |

The 3 failures are one real, intermittent defect on the live site: after a top-nav click the
page changes but the `<title>` stays on the home page's title. The suite reports known defects
as failures instead of hiding them.

## Other commands

```bash
npm test                    # Chromium only
npm run test:all            # Chromium, Firefox and WebKit
npm run test:cross-browser  # Firefox and WebKit only
npm run test:smoke          # @smoke subset
npm run test:api            # API checks only (no browser)
npm run test:navigation     # also: test:trading, test:content, test:negative
npm run typecheck
```

Any Gherkin tag works as a filter: `npx bddgen && npx playwright test --grep "@trading"`.

Every `npm run test*` script clears old Allure results first, so a report shows only the latest
run. If you call `npx playwright test` directly, run `npm run clean:results` first.

Configuration is read from environment variables or a `.env` file. Copy
[.env.example](.env.example) to `.env` to change the target URL, timeouts, workers or
`HEADLESS`. Browsers are visible locally by default and headless on CI.

## Coverage

| Area | Feature file | What is checked |
|---|---|---|
| 1. Navigation and layout | `01_navigation.feature` | All 7 nav items visible **in order**; Sign in and Sign up present; logo links home; each internal item lands on the right path, title and heading; external items (`$MBG`, Sign in, Sign up) have the right `href` and respond; at 1280, 1366, 1440 and 1920 px the nav fits on one row, the menu button is hidden and there's no horizontal scroll |
| 2. Trading | `02_trading.feature` | Spot market section, tabs and at least 5 pairs render; for **Hot, Gainers and Losers** every listed pair is in that category of the page's own `/market/widget` feed, **in the same order**; switching category regroups pairs; each row passes field rules (ticker, name, icon with alt text, USD price, % change, 7-day chart, asset link); no `NaN` or `undefined` cells; clicking a pair opens `/explore/{SYMBOL}` |
| 3. Content and links | `03_content.feature` | 3 promo banners visible with subtitles **and placed between the H1 and the spot market**; "Download the app" resolves to the **App Store** (iOS user agent) and **Google Play** (Android user agent, `com.multibank.app`) and the listing responds; **About Us → Why MultiBank**: H1, hero copy, key figures, three pillars, highlights, CTA, all images loaded |
| 4. Negative and edge cases | `04_negative.feature` | Unknown routes return a real 404 (no soft 404, no stack trace); broken-link scan of header and footer; slow market data still renders within budget; failed market data degrades without malformed values or uncaught JS errors; a hanging third-party chat widget doesn't block the page |
| API | `05_api.feature` | Status, JSON syntax and latency budget for instruments, widget and prices; every record validated against a schema (types, formats, URLs, formatted vs numeric prices; [src/support/apiSchemas.ts](src/support/apiSchemas.ts)); core assets present; categories reference only known instruments |

38 scenarios. Firefox and WebKit run all of them except the 5 `@api` scenarios.

## Architecture

```
features/                 Gherkin specs, tagged (@smoke @api @navigation @trading @timeout …)
src/
  config/env.ts           single source of runtime config (URLs, locale, timeouts) from env or .env
  data/                   test data and oracles: nav destinations, page registry, field rules, store specs, link lists
  pages/                  Page Objects (BasePage, ExplorePage, CompanyPage)
    components/           reusable components (Header, Footer, SpotMarket)
  fixtures/fixtures.ts    Playwright fixtures injected into steps (consent handler, JS-error capture)
  steps/                  step definitions, one file per domain; thin, delegate to pages and support
  support/                typed API client, schema validator, link checker, deep-link resolver, URL helpers
docs/                     Task 2 answers, test plan, risk matrix, release checklist, sample reports
playwright.config.ts      browser projects, reporters, retries, traces
```

## Design decisions

- **playwright-bdd over cucumber-js.** Features compile to Playwright specs, so Gherkin gets the real Playwright runner: parallel workers, a project per browser, retries, traces and video on failure, and fixtures, with no hand-rolled World or browser lifecycle.
- **Thin steps, external data.** Adding a nav item, page, banner, store or field rule is a data-table or `src/data` change, not new step code. Field rules are a named validator registry (`pairFieldValidators`) referenced from the feature file.
- **The app's own API is the oracle.** Category grouping is checked against the `/market/widget` response the page actually received (captured from network traffic), with polling to absorb live price updates, instead of hard-coded symbols that go out of date.
- **API schema validation without a dependency.** A small validator ([src/support/schema.ts](src/support/schema.ts)) checks every record and reports the exact path, for example `$[USD].displayName: is missing`. JSON parse errors are reported with the raw body instead of being swallowed.
- **Known defects fail.** There are no exemptions or skips for known issues. A defect stays red until it's fixed, so the report reflects the real state of the site.
- **Locale-agnostic.** The site geo-redirects (`/en-AE/...` from the UAE). URL assertions use `pathMatcher()`, which accepts any locale prefix; `LOCALE=` forces one.
- **Stable selectors.** Role and name locators for navigation and content. For the market table, the cells' stable `id` suffixes (`_displayName-td`, `_price-td`, `_change-td`, `_week-chart-td`) rather than generated CSS classes.
- **Resilient by default.** A locator handler dismisses any consent banner, choosing reject or necessary-only. Uncaught page errors are recorded on every UI test and attached to the report. Third-party hosts that block bots (401, 403, 429) are reported as warnings rather than failing the broken-link check.
- **Cross-browser by configuration.** Firefox and WebKit are Playwright projects switched on by `CROSS_BROWSER=1`. CI runs one job per browser and merges the Allure results.
- **Reporting.** Allure gets Gherkin steps as nested steps, tags as labels, environment info, and attachments: per-row trading data, link-check tables, deep-link redirect chains, API samples, and trace, video and screenshot on failure.

## Assumptions

- **Target site.** `https://trade.multibank.io/` now redirects (in the regions checked) to `https://trade.mb.io/login`, which needs a login. Every public scenario in the brief lives on the rebranded site `https://mb.io`, so that is the default `BASE_URL`.
- **No accounts, no personal data.** Nothing signs up, signs in or submits personal or financial data. Account buttons are checked by their `href` and an HTTP request only.
- **Live data.** Prices and category order change all the time. Assertions check format, membership and relative order against the same feed snapshot, never fixed values.
- **Region.** From the UAE, mb.io serves the VARA-regulated entity under `/en-AE`. Other regions may see different content. Runs should come from a consistent region, or set `LOCALE`.
- **Desktop only.** The suite covers desktop viewports. Mobile and visual-comparison scenarios were removed from scope.
- **API contract.** No public API spec was available. The schemas are based on what the site consumes. `displayName` is optional because the API omits it for some instruments (USD, ENA, SKY, GRT, CRV, LIT, MORPHO, RLUSD).
- **App download.** mb.io exposes a single smart link (`*.go.link`) instead of separate store badges. It is resolved per device user agent, following HTTP redirects hop by hop or reading the store URL from a JavaScript redirect page.
- **Task 2 documents.** The test plan, release readiness checklist and risk matrix are written for the Task 2 scenario: a mobile trading app two weeks from its first public release.

## Extending

- **New page:** add it to `src/data/pages.ts`, then `Given I open the "<name>" page` works.
- **New nav item:** add it to `primaryNav` in `src/data/navigation.ts` and to the Examples table.
- **New field rule:** add a validator to `pairFieldValidators` and reference it in the data table.
- **New API field:** add it to the endpoint's schema in `src/support/apiSchemas.ts`.
- **New browser or device:** add a project in `playwright.config.ts`.
