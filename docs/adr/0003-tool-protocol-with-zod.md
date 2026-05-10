# ADR-0003: Tool Protocol With Zod

## Status

Accepted

## Context

The project needs explicit architecture decisions that can be reviewed and revisited.

## Decision

Use Zod for runtime validation of model-generated tool inputs, tool outputs, config, and events.

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
