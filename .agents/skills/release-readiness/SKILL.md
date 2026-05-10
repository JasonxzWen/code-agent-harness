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
6. Verify demo script and fixture repo.
7. Produce a release readiness report:
   - scope status;
   - quality status;
   - docs status;
   - known limitations;
   - blockers;
   - release recommendation.

Never create a Git tag or push unless explicitly requested.
