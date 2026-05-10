# Research and Spec Process

Research and specs are used to make design decisions explicit and reproducible.

## Research note

Path:

```txt
docs/research/<release>/<topic>.md
```

Template:

```md
# Research: <Topic>

## Problem

## Release relevance

## Sources reviewed

## Industry practice

## Alternatives considered

## Trade-off matrix

## Project-specific constraints

## Recommendation

## Acceptance criteria impacted

## Open questions
```

## Spec

Path:

```txt
docs/specs/<release>/<topic>.md
```

Template:

```md
# Spec: <Topic>

## Scope classification

## Problem

## User-facing behavior

## Internal design

## APIs / contracts

## Data/state model

## Error handling

## Permission/security considerations

## Testing plan

## Documentation impact

## Acceptance criteria

## Non-goals

## Rollout plan
```

## Alignment brief

Before implementation, provide a short brief:

```md
## Alignment Brief

### Problem

### Why now

### Options considered

### Recommended decision

### Trade-offs

### Implementation plan

### Acceptance criteria
```

The brief should recommend a default rather than ask open-ended design questions.
