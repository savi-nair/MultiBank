# Test Plan: Mobile Trading App, First Public Release

| | |
| --- | --- |
| Product | Mobile trading app (iOS and Android) |
| Release | v1.0, first public release |
| Test window | 2 weeks (10 working days) |
| Owner | QA lead |
| Related | [Task 2 answers](task2-qa-approach.md) · [Risk matrix](risk-matrix.md) · [Release readiness checklist](release-readiness-checklist.md) |

## 1. Objective

Give the business an evidence-based go/no-go decision for v1.0. Every flow that moves or shows money must be proven on both platforms. Every remaining risk must be known, documented and accepted by the Product Owner.

## 2. Scope

**In scope**

- Sign-up, login, logout, session handling, biometrics, 2FA
- KYC and onboarding, including vendor failure
- Deposits and withdrawals, including payment provider failure
- Market data: price display, freshness, charts, watchlists
- Orders: market and limit, place, partial fill, fill, cancel, reject
- Balances, portfolio, transaction history and ledger reconciliation
- Push notifications and deep links
- CMS-driven content: terms, fees, banners
- Mobile behaviour: network loss, backgrounding, app kill, permissions, OS and screen matrix
- Security checks at app level (storage, transport, session)
- Basic accessibility (font scaling, screen readers, contrast)

**Out of scope for v1.0** (agreed with the Product Owner; covered by other teams or later releases)

- Full penetration test (requested separately from the security team before launch)
- Full load and performance testing (requested from the platform team; QA reviews the results)
- Tablet layouts, if not a launch target
- Back-office and admin tools

## 3. Approach

Risk-based. Areas are ranked in the [risk matrix](risk-matrix.md) and tested in priority order: P0 first, then P1, then P2.

| Test type | What it covers | Tooling |
| --- | --- | --- |
| API and contract | Orders, balances, fees, limits, auth, schema and data accuracy | Playwright request API or Postman, run in CI |
| End to end (UI) | 15 to 25 critical journeys on both platforms | Appium or Maestro on iOS Simulators and Android Emulators |
| Exploratory | Time-boxed charters on P0 and P1 areas | Session notes, screen recordings |
| Mobile conditions | Network loss, backgrounding, app kill, low memory, permissions | Network Link Conditioner, emulator controls |
| Security (app level) | Token storage, session expiry, pinning, root and jailbreak, masking | Manual checks, proxy inspection |
| Reconciliation | App, API and ledger agree after every money action | Backend queries, API checks |
| Real-device check | Money flows on physical phones before release | 1 to 2 iPhones, 2 Android phones (incl. low-end) |

**Test design techniques:** boundary value analysis and equivalence partitioning for amounts, fees and limits; state-transition testing for the order lifecycle; decision tables for KYC rules; error guessing for retries, double taps and timeouts.

## 4. Environments and test data

- **Staging** with production-like config, connected to third-party sandboxes (price feed, payments, KYC).
- **Device matrix:** current and previous major iOS on a small and a large iPhone; current and two older Android versions on small and large screens, including a low-RAM profile.
- **Test accounts:** seeded per KYC level (none, pending, verified, rejected), per balance state (empty, funded, multi-asset), and one locked account.
- **Data rules:** tests create their own data through the API. No shared accounts between automated tests. No real customer data in staging.

## 5. Schedule

| Days | Focus | Output |
| --- | --- | --- |
| 1 to 3 | Smoke pass, flow mapping, environments and data, risk matrix sign-off | Risk matrix, smoke results, blocker list |
| 4 to 7 | P0 testing: orders, balances, deposits, withdrawals, auth | Defects raised, P0 API suite in CI |
| 8 to 10 | P1 testing, mobile conditions, exploratory sessions, E2E smoke automation | Defects raised, E2E smoke in CI |
| 11 to 12 | Release candidate regression, fix verification, real-device check | Regression report |
| 13 | Code freeze, final regression of changed areas | Release readiness report |
| 14 | Go/no-go meeting, staged rollout starts | Signed release checklist |

## 6. Entry and exit criteria

**Entry (testing starts when)**

- Build installs on both platforms and passes the smoke pass
- Staging and third-party sandboxes are reachable
- Seeded test accounts exist
- Acceptance criteria exist for P0 features (written by QA with the PO if missing)

**Exit (ready to release when)**

- 100% of P0 scenarios executed and passed on iOS and Android
- At least 95% of P1 scenarios passed; every failure triaged and accepted
- Zero open critical or high defects in P0 areas
- Reconciliation checks pass for every money flow
- Force-update, feature flags and kill switch verified in staging
- Monitoring and alerting confirmed for failed orders, payment errors and crashes
- Product Owner sign-off on the [release readiness checklist](release-readiness-checklist.md)

**Suspension:** testing of an area stops if a critical defect blocks its main flow or staging is unstable for more than half a day. It resumes when the blocker is fixed.

## 7. Defect management

| Severity | Definition | Example | Target fix |
| --- | --- | --- | --- |
| Critical | Money loss, data exposure, or a P0 flow blocked | Order placed twice on retry | Same day; blocks release |
| High | P0 or P1 flow wrong but a workaround exists | Balance refreshes only after restart | Before release |
| Medium | Non-core flow broken or wrong | Chart range button does nothing | Next sprint unless cheap |
| Low | Cosmetic or copy issue | Misaligned label | Backlog |

Every defect carries steps, expected vs actual, platform, OS, device, build number, logs and a screenshot or video. Triage runs daily with the PO and tech lead.

## 8. Roles

| Role | Responsibility |
| --- | --- |
| QA lead | Plan, risk matrix, test execution, automation, daily status, release report |
| Developers | Unit tests, fixes, test hooks, early builds |
| Product Owner | Scope, acceptance criteria, defect priority, risk acceptance, go/no-go |
| Tech lead | Environments, flags and kill switch, monitoring, technical risk |
| Security / platform teams | Pen test and load test results before launch |

## 9. Deliverables

- Risk matrix (day 3)
- Daily status: coverage by risk area, open defects by severity, blockers
- Automated API suite and E2E smoke suite, running in CI
- Regression report on the release candidate
- Release readiness report and signed checklist

## 10. Planning risks and contingencies

| Risk | Contingency |
| --- | --- |
| Builds arrive late | Test APIs first; they do not need the UI |
| Third-party sandbox unavailable | Use contract stubs for the failure cases; flag the gap in the release report |
| Critical defects found late | Scope cut or feature flag off, agreed with the PO, rather than slipping the date blindly |
| Not enough time for P2 | P2 is the first thing cut; documented as accepted risk |
| Staging unstable | Escalate same day; track lost hours in the daily status |
