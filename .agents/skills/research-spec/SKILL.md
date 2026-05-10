---
name: research-spec
description: Use when a non-trivial feature, architecture decision, provider behavior, tool design, permission rule, or context/eval change needs research and a spec before coding.
---

Follow this workflow:

1. Classify scope: `v0.1 blocker`, `v0.1 nice-to-have`, `later release`, or `reject`.
2. Inspect existing docs: release contract, architecture, standards, acceptance criteria, relevant ADRs.
3. Research only sources that affect the decision. Prefer official docs and source repositories.
4. Produce `docs/research/<release>/<topic>.md` using `docs/templates/research-note-template.md`.
5. Produce `docs/specs/<release>/<topic>.md` using `docs/templates/spec-template.md`.
6. Provide an alignment brief with problem, options, recommendation, trade-offs, and acceptance criteria.
7. Do not implement until the user approves or explicitly provides an auto-implementation instruction.

Keep research scoped. Do not use research to expand release scope.
