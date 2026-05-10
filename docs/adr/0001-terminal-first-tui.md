# ADR-0001: Terminal First Tui

## Status

Accepted

## Context

The project needs explicit architecture decisions that can be reviewed and revisited.

## Decision

Use terminal-first Ink TUI for v0.1 because coding agents are primarily developer tools and need visible event/permission state.

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
