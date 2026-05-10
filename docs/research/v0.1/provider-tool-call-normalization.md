# Research: Provider Tool Call Normalization

## Problem

v0.1 uses OpenAI first while keeping a provider abstraction boundary. Provider
SDKs expose different tool-call shapes, but `packages/core` must receive one
internal `ToolCall` contract and must not import provider SDK types.

## Release relevance

Scope classification: `v0.1 blocker`.

This work maps to:

- F-04 provider call;
- F-05 tool normalization;
- F-06 tool validation;
- provider boundary requirements in engineering standards.

## Sources reviewed

- `docs/releases/v0.1.0-contract.md`
- `docs/architecture/v0.1-minimal-coding-agent.md`
- `docs/adr/0004-provider-abstraction.md`
- `docs/agent/tool-protocol.md`
- `docs/engineering/standards.md`
- `docs/engineering/testing-strategy.md`

## Industry practice

Agent runtimes usually normalize provider responses at adapter boundaries. This
keeps the core loop stable when SDK response shapes, model capabilities, or
provider-specific tool-call variants change.

## Alternatives considered

| Option                                   | Description                                    | Decision                          |
| ---------------------------------------- | ---------------------------------------------- | --------------------------------- |
| Core reads provider SDK shapes           | Agent loop handles SDK responses directly      | Reject: violates package boundary |
| Provider returns loosely typed JSON      | Core validates everything from scratch         | Reject: weak adapter contract     |
| Adapter normalizes to internal contract  | Provider package maps SDK shapes to `ToolCall` | Accept                            |
| Full multi-provider normalization matrix | Implement all provider variants in v0.1        | Reject: scope expansion           |

## Trade-off matrix

| Criterion               | Core SDK handling | Adapter normalization |
| ----------------------- | ----------------- | --------------------- |
| Boundary preservation   | Low               | High                  |
| v0.1 simplicity         | Medium            | High                  |
| OpenAI-first delivery   | Medium            | High                  |
| Future provider support | Low               | Medium                |
| Testability             | Low               | High                  |

## Project-specific constraints

- `packages/core` must not import OpenAI or Anthropic SDK types.
- `packages/providers` must not execute tools.
- Anthropic remains a boundary stub in v0.1.
- Unknown or unsupported provider tool-call variants must fail safely.
- Normalized calls must still pass strict tool validation in `packages/tools`.

## Recommendation

Keep provider-specific parsing inside `packages/providers`. The OpenAI adapter
must map supported function tool calls to the internal `ToolCall` shape:

```txt
{ id, name, input }
```

Unsupported tool-call variants should produce a provider error or be ignored
only when that behavior is explicit and tested. The adapter must not pass raw
SDK objects through to core.

## Acceptance criteria impacted

- F-04: provider receives normalized messages and tool specs.
- F-05: provider tool calls normalize into internal calls.
- F-06: normalized input is validated by the tool registry.
- Engineering: provider SDK types stay out of core.

## Open questions

- Should unsupported tool-call variants fail the run or be skipped with a trace
  event?
- Should adapter tests use SDK-shaped fixture objects or higher-level provider
  responses?
- Should the Anthropic stub expose a normalization placeholder or remain a
  hard error until its release target changes?
