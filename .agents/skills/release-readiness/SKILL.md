---
name: release-readiness
description: Use before creating or preparing a release. Checks release contract, quality gates, docs, changelog, known limitations, and demo readiness.
---

Release-readiness workflow:

1. Read `docs/releases/<version>-contract.md`.
2. Check that implemented scope matches the contract.
3. Verify non-goals did not slip in.
4. Run or confirm quality gates.
5. Verify README, CHANGELOG, ADRs, architecture docs, and release notes.
6. Verify every user-visible feature has a feature card covering what it is,
   the user need, primary scenario, industry practice, this project's approach,
   why that approach fits, how it is implemented, E2E acceptance, benchmark
   evidence, and limitations.
7. Verify every user-visible feature has E2E acceptance evidence. Unit tests
   alone are not enough unless the feature is not user-visible and the exception
   is documented.
8. Verify benchmark evidence for release features: benchmark question, metric,
   fixture, command or artifact, threshold, result, peer baseline, and caveats.
9. Verify demo script and fixture repo.
10. Produce a release readiness report:

- scope status;
- quality status;
- docs status;
- feature-card status;
- E2E acceptance status;
- benchmark status;
- known limitations;
- blockers;
- release recommendation.

Never create a Git tag or push unless explicitly requested.
