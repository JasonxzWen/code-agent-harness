---
name: implementation-quality
description: Use when implementing approved changes. Ensures coding, tests, docs, quality gates, self-review, and final reporting happen consistently.
---

Implementation workflow:

1. Read the approved spec or release contract.
2. Inspect relevant files before editing.
3. Make focused changes only.
4. Add or update tests for success and failure paths.
5. Update docs if public behavior changes.
6. For user-visible feature work, update or add E2E acceptance evidence. Unit
   tests alone are not enough for a release feature unless the exception is
   documented.
7. For release feature work, update benchmark evidence: benchmark question,
   metric, fixture, command or artifact, threshold, result, peer baseline, and
   caveats.
8. Run quality gates:
   - `bun run format:check`
   - `bun run lint`
   - `bun run typecheck`
   - `bun run test`
   - `bun run smoke`
9. Fix failures if possible.
10. Self-review the diff using `docs/engineering/code-review.md`.
11. Return final report with review-focused change points, file and line number
    references, quality gate table, self-review, limitations, and next step.
    Each change point must explain what changed, why it changed, and how it works
    in plain language before pointing to the implementation. Treat this as a
    Feynman-style handoff: a reviewer should understand the change without first
    reading the whole diff. Do not use a bare files-changed list as the main
    handoff when asking for human review.

Do not claim a command passed unless it actually passed.
