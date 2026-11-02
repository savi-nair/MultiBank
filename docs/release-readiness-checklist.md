# Release Readiness Checklist: Mobile Trading App v1.0

Used at the go/no-go meeting. Every item needs evidence (a report, a link or a named person). Any unchecked item in a **blocking** section stops the release unless the Product Owner accepts it in writing under [Accepted risks](#accepted-risks).

Exit criteria come from the [test plan](test-plan.md). Risks come from the [risk matrix](risk-matrix.md).

## 1. Testing (blocking)

- [ ] 100% of P0 scenarios executed and passed on iOS and Android
- [ ] At least 95% of P1 scenarios passed; every failure triaged
- [ ] Full regression passed on the exact release candidate build (build number recorded)
- [ ] Money flows checked by hand on real devices (at least 1 iPhone and 2 Android phones, including a low-end model)
- [ ] App, API and ledger reconcile for deposit, buy, sell and withdrawal
- [ ] Retry, double-tap and app-kill tests show no duplicate orders or withdrawals
- [ ] Third-party failure tests (payments, KYC, price feed) show pending or failed states, never a false success
- [ ] Exploratory sessions completed for all P0 areas, notes attached

## 2. Defects (blocking)

- [ ] Zero open critical defects
- [ ] Zero open high defects in P0 areas
- [ ] Every open medium or low defect reviewed and accepted by the Product Owner
- [ ] Known issues written up for support, with workarounds

## 3. Security and compliance (blocking)

- [ ] Penetration test completed; no open critical or high findings
- [ ] 2FA or step-up authentication enforced on withdrawals and new withdrawal addresses
- [ ] Session expiry, logout and token storage verified
- [ ] Sensitive screens masked in the app switcher and screenshots where required
- [ ] Terms, fees and risk disclosures approved by Compliance and shown correctly, including when the CMS is unreachable
- [ ] KYC rules signed off by Compliance

## 4. Operational readiness (blocking)

- [ ] Force-update mechanism verified in staging
- [ ] Feature flags in place for high-risk features (trading, withdrawals) and tested on and off
- [ ] Server-side kill switch verified
- [ ] Load test of order and price endpoints passed at the agreed peak
- [ ] Alerts configured for failed orders, payment errors, price feed staleness and crash spikes
- [ ] Incident runbook published, with a named on-call owner for launch week
- [ ] Rollback or hotfix plan agreed for backend changes

## 5. Store and rollout

- [ ] App Store and Google Play builds match the tested release candidate
- [ ] Store listings, screenshots and privacy labels reviewed
- [ ] Staged rollout plan agreed (for example 5%, 25%, 100%) with the metrics that pause it
- [ ] Production smoke test plan ready for the first hour after release
- [ ] Crash-free sessions in beta at or above 99.5%

## 6. Communication

- [ ] Release report shared: scope, test results, open defects, accepted risks
- [ ] Support team briefed on known issues and escalation path
- [ ] Go/no-go meeting held with Product Owner, tech lead, QA lead, Security and Compliance

## Accepted risks

| Risk ID | Description | Why accepted | Accepted by | Date |
| --- | --- | --- | --- | --- |
| | | | | |

## Sign-off

| Role | Name | Decision (Go / No-go) | Date |
| --- | --- | --- | --- |
| Product Owner | | | |
| Tech lead | | | |
| QA lead | | | |
| Security | | | |
| Compliance | | | |
