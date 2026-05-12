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

## Industry scan

## Industry practice

## Alternatives considered

## Trade-off matrix

## Project-specific constraints

## Recommendation

## Acceptance criteria impacted

## Open questions
```

`Industry scan` is required for release work. It must list the current
mainstream products or projects checked for the release decision. Start with
OpenAI Codex, Claude Code, and opencode, then add release-relevant peers such as
Aider, OpenHands, OpenClaw, or Hermes Agent. For each source, record the
decision signal for this project, not just a link.

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

## E2E acceptance plan

## Benchmark plan

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
For release work, the brief must state which industry scan was refreshed and how
it shaped the recommendation.
It must also identify the planned E2E acceptance scenario and benchmark question
for each user-visible feature.
