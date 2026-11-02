# Risk Matrix: Mobile Trading App v1.0

Each risk is scored for **likelihood** (how likely it is to happen at launch) and **impact** (how much it would hurt users and the business), each from 1 to 5. **Score = likelihood × impact.** The score sets the test priority and the order of work in the [test plan](test-plan.md).

| Score | Rating | Priority | Release rule |
| --- | --- | --- | --- |
| 15 to 25 | Critical | P0 | Must be mitigated and tested before release |
| 8 to 14 | High | P1 | Mitigated, or explicitly accepted by the Product Owner |
| 4 to 7 | Medium | P2 | Tested if time allows; accepted risk otherwise |
| 1 to 3 | Low | P3 | Monitored after release |

## Heat map

Risk IDs placed by likelihood (rows) and impact (columns). Top-right is worst.

| Likelihood ↓ / Impact → | 1 Minimal | 2 Minor | 3 Moderate | 4 Major | 5 Severe |
| --- | --- | --- | --- | --- | --- |
| **5 Almost certain** | | | | | |
| **4 Likely** | | | R13 | R9 | R1, R4 |
| **3 Possible** | | R14 | R11, R12 | R6, R7, R10 | R2, R3, R5 |
| **2 Unlikely** | | | | R8 | |
| **1 Rare** | | | | | |

## Risk register

| ID | Risk | L | I | Score | Rating | Mitigation | Owner |
| --- | --- | --- | --- | --- | --- | --- | --- |
| R1 | Duplicate order on retry, double tap or app kill mid-order | 4 | 5 | 20 | Critical | Idempotency keys on order API; tests for retries, double taps, timeouts and app kill | Tech lead / QA |
| R4 | Balance in the app differs from the ledger | 4 | 5 | 20 | Critical | Reconcile app, API and ledger after every money test; precision and rounding tests | QA |
| R9 | iOS and Android behave differently in a money flow | 4 | 4 | 16 | Critical | Every P0 scenario run on both platforms; same API suite for both | QA |
| R2 | Withdrawal sent twice, to the wrong address, or without step-up auth | 3 | 5 | 15 | Critical | 2FA on withdrawals; address confirmation; idempotency; negative tests | Tech lead / QA |
| R3 | Account takeover or session leak | 3 | 5 | 15 | Critical | Pen test before launch; session expiry, token storage, pinning, root/jailbreak checks | Security / QA |
| R5 | No way to stop a bad release (no force-update or kill switch) | 3 | 5 | 15 | Critical | Force-update, feature flags and server-side kill switch built and tested in staging | Tech lead |
| R6 | Stale or wrong prices shown as live | 3 | 4 | 12 | High | Price freshness checks and "feed stopped" state; API data validation in CI | Tech lead / QA |
| R7 | Third-party failure (payments, KYC, price feed) shows a false success | 3 | 4 | 12 | High | Sandbox failure tests and contract stubs; app must show pending or failed, never success | QA |
| R10 | App slows or fails under volatile-market load | 3 | 4 | 12 | High | Load test of order and price endpoints at several times expected peak; autoscaling review | Platform team |
| R13 | No alerting, so production failures are found by users first | 4 | 3 | 12 | High | Alerts on failed orders, payment errors and crash spikes; incident runbook with on-call owner | Tech lead |
| R11 | Push notifications late, duplicated or missing | 3 | 3 | 9 | High | Delivery and deep-link tests; app state when a notification is tapped | QA |
| R12 | CMS unreachable: terms, fees or banners missing or out of date | 3 | 3 | 9 | High | CMS outage and slow-response tests; bundled fallback content for legal and fee text | Tech lead / QA |
| R8 | KYC wrongly approves or blocks users | 2 | 4 | 8 | High | Decision-table tests for KYC rules; vendor failure cases | QA / Compliance |
| R14 | UI/UX or accessibility defects | 3 | 2 | 6 | Medium | Design comparison and basic accessibility checks; P2 in the test plan | QA |

## How the matrix is used

- Reviewed with the Product Owner and tech lead on day 3, then re-scored after each regression run.
- A risk's likelihood drops only with evidence: a passing test, a verified mitigation, or a vendor report.
- Any Critical or High risk still open at the go/no-go meeting needs written acceptance from the Product Owner. It is listed in the release report.
