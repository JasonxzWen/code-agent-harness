---
name: research-spec
description: Use when a non-trivial feature, architecture decision, provider behavior, tool design, permission rule, or context/eval change needs research and a spec before coding.
---

Follow this workflow:

1. Classify scope: `v0.1 blocker`, `v0.1 nice-to-have`, `later release`, or `reject`.
2. Inspect existing docs: release contract, architecture, standards, acceptance criteria, relevant ADRs.
3. For release work, refresh the mainstream product scan before implementation.
   Start with OpenAI Codex, Claude Code, and opencode; add release-relevant
   peers such as Aider, OpenHands, OpenClaw, or Hermes Agent. Prefer official
   docs, official repositories, and maintainer-authored material.
4. Research only sources that affect the decision. Map every external signal to
   this project's release scope; do not turn research into a feature wishlist.
5. Produce `docs/research/<release>/<topic>.md` using `docs/templates/research-note-template.md`.
6. Produce `docs/specs/<release>/<topic>.md` using `docs/templates/spec-template.md`.
7. Provide an alignment brief with problem, options, recommendation, trade-offs,
   acceptance criteria, E2E acceptance plan, benchmark question/metrics, and the
   refreshed industry scan used.
8. Do not implement until the user approves or explicitly provides an auto-implementation instruction.

Keep research scoped. Do not use research to expand release scope.
