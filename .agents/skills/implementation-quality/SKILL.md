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
6. Run quality gates:
   - `bun run format:check`
   - `bun run lint`
   - `bun run typecheck`
   - `bun run test`
   - `bun run smoke`
7. Fix failures if possible.
8. Self-review the diff using `docs/engineering/code-review.md`.
9. Return final report with files changed, quality gate table, self-review, limitations, and next step.

Do not claim a command passed unless it actually passed.
