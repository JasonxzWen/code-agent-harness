# ADR-0007: No Memory In V0.1

## Status

Accepted

## Context

The project needs explicit architecture decisions that can be reviewed and revisited.

## Decision

Do not implement persistent memory in v0.1 because it adds privacy, contamination, and persistence complexity.

## Alternatives considered

- Do nothing and rely on ad hoc convention.
- Encode the decision only in prompts.
- Record the decision in an ADR.

## Trade-offs

Pros:

- decision is auditable;
- future contributors can understand why the project is shaped this way;
- release scope stays stable.

Cons:

- creates documentation overhead;
- stale ADRs must be maintained.

## Revisit

Revisit when the related release scope changes or when implementation evidence contradicts the decision.
