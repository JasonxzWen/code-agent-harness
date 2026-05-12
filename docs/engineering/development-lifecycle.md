# Development Lifecycle

This project uses a release-driven engineering lifecycle.

## Lifecycle

```txt
Research
→ Spec
→ Alignment
→ Implementation
→ Quality Gates
→ Self-review
→ Release Update
```

## When research is required

Research is required for every release and for new components, public
contracts, provider behavior, permissions, context strategy, evaluation,
security, or dependency choices.

Research is not required for small fixes where the correct behavior is already documented.

Every release must include a scoped industry scan before implementation starts.
At minimum, review current public material for OpenAI Codex, Claude Code, and
opencode, plus any release-relevant peers such as Aider, OpenHands, OpenClaw,
or Hermes Agent. The scan must map external behavior to this project's release
scope; it must not become a feature wishlist.

## When coding may begin

Coding may begin when:

- the scope classification is clear;
- the relevant release contract is not violated;
- the spec defines acceptance criteria;
- release-relevant industry practice has been reviewed or explicitly judged not
  applicable with a reason;
- user-visible features have an E2E acceptance plan;
- release features have a benchmark question, metrics, and expected evidence;
- required public behavior and tests are known.

## Implementation expectations

- inspect relevant files before editing;
- make focused changes;
- add/update tests;
- add/update E2E acceptance for user-visible workflows;
- update benchmark evidence for release features;
- update docs for public behavior;
- update release documentation when behavior, capability boundaries, quality
  evidence, or user-facing workflows change;
- run quality gates;
- self-review the diff;
- report limitations honestly.
- when pausing for review, explain the current change with what changed, why it
  changed, and how it was implemented, using concrete file and line references.

## Release documentation expectations

Release updates must follow `docs/engineering/release-documentation-standard.md`.

From `v0.2.0` onward, new release-facing docs must use Chinese as the body
language. A release note must include features, Mermaid diagrams, key code
definition locations, implementation rationale, industry comparison, quality
evidence, known limitations, and next steps.

## Stop conditions

Stop before implementation if:

- the request conflicts with release scope;
- safety policy must be weakened;
- a public contract would break without a migration plan;
- credentials or paid services are required and unavailable;
- the requested operation is destructive.
