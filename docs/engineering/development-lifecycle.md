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

Research is required for new components, public contracts, provider behavior, permissions, context strategy, evaluation, security, or dependency choices.

Research is not required for small fixes where the correct behavior is already documented.

## When coding may begin

Coding may begin when:

- the scope classification is clear;
- the relevant release contract is not violated;
- the spec defines acceptance criteria;
- required public behavior and tests are known.

## Implementation expectations

- inspect relevant files before editing;
- make focused changes;
- add/update tests;
- update docs for public behavior;
- run quality gates;
- self-review the diff;
- report limitations honestly.

## Stop conditions

Stop before implementation if:

- the request conflicts with release scope;
- safety policy must be weakened;
- a public contract would break without a migration plan;
- credentials or paid services are required and unavailable;
- the requested operation is destructive.
