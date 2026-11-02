# Sample run: cross-browser, 2 November 2026

Full suite against `https://mb.io` on Chromium, Firefox and WebKit, run with `HEADLESS=true npm run test:all`.

**104 tests: 101 passed, 3 failed, 3.8 minutes, 4 workers.**

| Browser project | Version | Tests | Passed | Failed |
| --- | --- | --- | --- | --- |
| desktop-chromium | Chromium 156.0.8078.4 | 38 | 38 | 0 |
| desktop-firefox | Firefox 157.0 | 33 | 32 | 1 |
| desktop-webkit | WebKit 27.2 | 33 | 31 | 2 |

Firefox and WebKit run every scenario except the `@api` ones. API checks have no browser, so they run once, on Chromium.

Environment: macOS 26.5, Node 22.5.1, Playwright 1.64.1. The site served the `/en-AE` locale.

## Evidence

- [playwright-report.html](playwright-report.html): Playwright HTML report. Download it and open it in a browser; filter by project to see each browser.
- [allure-report.html](allure-report.html): single-file Allure report with Gherkin steps, tags, attachments and environment info. Failure videos and traces are left out to keep the file under 10 MB; CI keeps them as artifacts.
- [run-log.txt](run-log.txt): console output of the run.
- [screenshots/](screenshots/): screenshot of each failure.

## Failures

All three failures are the same live-site defect, not test flakiness:

| Browser | Scenario | Expected title | Actual title |
| --- | --- | --- | --- |
| Firefox | "Explore" opens the correct page | matches `/Explore/i` | `Trade Crypto Fast & Secure \| Low Fees Exchange \| mb.io` |
| WebKit | "OTC Desk" opens the correct page | matches `/OTC/i` | same home page title |
| WebKit | "Company" opens the correct page | matches `/About/i` | same home page title |

**What happens:** after a top-nav click, the URL and page content change to the destination, but the document `<title>` stays on the home page's title. It is intermittent (it passed on Chromium in this run and on other items in the same browsers), which points to a client-side routing race in the site rather than a browser-specific bug.

**Why the test keeps failing on it:** a stale title is a real defect (wrong tab name, bookmarks, SEO, screen readers). The suite does not hide known issues, so these stay red until the site is fixed.
