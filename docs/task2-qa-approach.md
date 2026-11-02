# Task 2: QA Approach for a Mobile Trading App

Scenario: a mobile trading app for iOS and Android ships in two weeks. There are no tests and no QA documents. Real user funds are at stake.

My goal is not to test everything. It is to give the business a clear, evidence-based release decision, with the money paths proven and the remaining risk known and accepted.

Supporting documents: [Test plan](test-plan.md) · [Release readiness checklist](release-readiness-checklist.md) · [Risk matrix](risk-matrix.md)

## 1. Where do you start?

I start with risk, not test cases. Two weeks is short, so the first three days decide whether the rest of the time is spent well.

**Days 1 to 3: understand and triage**

- Run a smoke pass on both apps on day one. A blocker found now is cheap. Found on day 12, it moves the launch.
- Meet the Product Owner, BA and tech lead. Agree the launch scope and what is out of scope.
- Map every money flow end to end: deposit, order, fill, balance, withdrawal. Note each system involved, including the price feed, matching engine, payment provider, KYC vendor and CMS.
- Collect what exists: acceptance criteria, BRD, Jira, designs, API specs. Where nothing is written, I write it down as I learn it.
- Secure the basics: a stable staging environment, sandbox accounts with third parties, seeded test users at each KYC level, simulators and a few real phones.
- Review crash reporting, logs and the open bug backlog. Existing defects show where the code is weak.

**Days 4 to 10: test by risk**

- Test the money paths and security first, on both platforms.
- Automate the critical API checks and a small smoke suite as I go.
- Triage bugs daily with the team.

**Days 11 to 14: harden and decide**

- Run full regression on the release candidate.
- Retest fixes. Freeze scope.
- Present a release report: what was tested, what failed, what risk remains.

On day one I also agree the exit criteria with the Product Owner. For example: zero open critical or high bugs on money flows, all P0 scenarios passed on both platforms, and crash-free sessions above 99.5% in beta. Agreeing this early stops the go/no-go call from becoming a debate under pressure.

## 2. How would you approach testing this app?

Risk-based testing. I rank each area by how badly a failure would hurt users and the business, then spend time in that order. The full scoring is in the [risk matrix](risk-matrix.md).

| Area | What can go wrong | Impact | Priority |
| --- | --- | --- | --- |
| Orders and execution | Duplicate, lost or mispriced orders | Direct financial loss | P0 |
| Balances and ledger | App balance differs from the ledger | Loss, regulatory breach | P0 |
| Deposits and withdrawals | Funds stuck, sent twice or to the wrong place | Loss, fraud | P0 |
| Authentication and security | Account takeover, session leaks | Fraud, reputational damage | P0 |
| Market data | Stale or wrong prices | Bad trades, complaints | P1 |
| KYC and onboarding | Users blocked or wrongly approved | Lost sign-ups, compliance risk | P1 |
| Notifications and CMS content | Late alerts, missing terms or fee info | Wrong decisions, compliance risk | P1 |
| UI/UX and accessibility | Layout or usability defects | Poor experience | P2 |

How I cover the P0 and P1 areas:

- **Test design:** boundary values and equivalence classes for amounts, fees and limits. State-transition tests for the order lifecycle: placed, partially filled, filled, cancelled, rejected.
- **API first:** most logic is in the backend, so I test it there. Status codes, schema, data accuracy and error handling. This covers both platforms at once.
- **Reconciliation:** after every money action I check that the app, the API and the ledger all agree, to the smallest unit.
- **Idempotency and concurrency:** repeated taps, retries after timeouts, and two devices acting on one account at the same time.
- **Third-party failure:** price feed, payment provider and KYC vendor slow, down or returning bad data. The app must fail safely and never show a false success.
- **Mobile conditions:** network loss mid-order, app killed or backgrounded, low memory, OS permission changes, and a matrix of OS versions and screen sizes.
- **Security:** token storage, session expiry, jailbreak and root detection, certificate pinning, masking in the app switcher, and step-up checks on withdrawals.
- **Exploratory sessions:** time-boxed charters on the riskiest flows. Scripts find known problems. Exploration finds the rest.

Every day I publish a short status: coverage by risk area, open defects by severity, and blockers. Stakeholders should never be surprised on release day.

## 3. QA inside a sprint

Quality is built in from the first conversation, not checked at the end. QA owns the quality process, but the whole team owns quality.

1. **Ticket creation and refinement:** every story needs testable acceptance criteria in Given/When/Then form, including negative and edge cases. I tag stories that touch money, security or third parties as high risk. Those get deeper review and test design up front.
2. **Sprint planning:** QA effort is part of the estimate. A story with no time to test is not ready. We confirm environments, test data and third-party sandbox access before we commit.
3. **Development:** I write test scenarios in parallel and review them with the developer and BA (three amigos). Developers run them locally before handing over. API tests are written as soon as the contract is agreed, not after the UI is ready.
4. **Story testing:** I test on both platforms, verify backend data, and run a short exploratory session. A story is done only when it meets the Definition of Done: acceptance criteria passed, no open critical or high bugs, automation added where it pays off, and logging in place.
5. **Defect management:** clear severity rules. Anything that can lose money or expose data is critical and stops the line. I track fix and retest time, and I look for patterns, not just single bugs.
6. **Continuous automation:** new critical scenarios join the regression suite in the same sprint. Smoke tests gate every build in CI.
7. **Release regression:** risk-based on the release candidate. The full automated suite, plus a manual pass on money flows and anything the sprint changed. A code freeze before regression keeps results meaningful.
8. **Release and after:** a written sign-off with known risks listed. Staged rollout, a production smoke test, and close watch on crashes, errors and support tickets for 48 hours.
9. **Retro:** I bring data: escaped defects, flaky tests, blocked time. Every escaped bug gets a root cause and a new test.

## 4. My ideal regression suite

A regression suite is only as good as the trust the team puts in it. Green must mean safe to release. Red must mean a real problem. I would rather have 200 reliable tests than 2,000 ignored ones.

- **Two layers:** most coverage sits in API tests for orders, balances, fees, deposits, withdrawals, auth and response contracts. On top, 15 to 25 end-to-end journeys on iOS and Android that a user must always be able to complete.
- **Tiered by risk:** a smoke suite under 10 minutes gates every build. The critical tier runs on every merge. The full suite runs nightly and on every release candidate. Money flows are in every tier.
- **Deterministic:** each test creates its own data through the API and cleans up after itself. No shared state, no fixed sleeps, safe to run in parallel.
- **Flakiness managed:** flaky tests are quarantined within a day, given an owner and fixed or deleted. I track the flake rate as a team metric.
- **Honest:** no skipping known bugs to keep the build green. Every production escape gets a regression test.
- **Simulators and emulators:** automation runs on iOS Simulators and Android Emulators across a defined OS and screen-size matrix, in our own CI. Before release, the money flows are checked by hand on a few real phones, because simulators miss real hardware issues.
- **Release gate:** a failure blocks the merge or the release. No manual overrides without sign-off.
- **Useful reporting:** Allure with screenshots, video, logs and API payloads. Trend data shows flaky areas and coverage gaps.
- **Maintained like product code:** page objects, readable BDD scenarios, config and test data kept apart, code review on every change. Tests are updated in the same ticket as the feature.

The Task 1 suite in this repository follows the same principles: API checks with schema validation, a small set of UI journeys, risk tags, independent tests, and failures that stay red until the defect is fixed.

## 5. What keeps me up at night

What worries me most are failures that cost users money silently, and failures we cannot undo quickly. For each risk below I've noted how I'd reduce it before launch.

- **Duplicate orders:** a user taps Buy on a slow network, sees a timeout, and retries. The first order went through, so they traded twice. I'd confirm the backend uses idempotency keys and test retries, double taps and app kills mid-order.
- **Wrong prices:** users trade on a stale price that the app shows as live. I'd test price freshness checks and what the app shows when the feed stops. I've seen a live feed return a price months out of date.
- **Wrong balances:** rounding errors or half-finished transactions leave the app out of step with the ledger. I'd reconcile app, API and ledger after every money test.
- **Security:** account takeover, weak sessions, or withdrawals without step-up checks. I'd push for a security review or pen test before launch, not after.
- **No quick rollback:** a bad mobile release can't be pulled back. Store review is slow and users don't update. Force-update, feature flags and a server-side kill switch must exist and be tested before day one.
- **Unknown bugs:** no test history and fast shipping mean defects nobody has looked for. iOS and Android may differ quietly. I'd use exploratory sessions and a closed beta with real, small amounts to surface them.
- **Busy market days:** volatility drives traffic spikes exactly when users need the app most. I'd ask for a load test of the order and price endpoints at several times expected peak.
- **Notification issues:** price alerts or order updates arrive late, twice, or not at all, so users act on wrong information. I'd test delivery, deep links and the app state when a notification is tapped.
- **CMS connection issues:** if the app can't reach the CMS, terms, fee info or banners may be missing or out of date, which is also a compliance risk. I'd test CMS outages, slow responses and the fallback content.
- **Monitoring:** would we spot a problem before users do? I'd confirm alerts on failed orders, payment errors and crash spikes, plus an incident runbook with a named on-call owner.
