# Research: Permission Gate and Strict Tool Validation

## Problem

The v0.1 release contract requires restricted commands to pause for approval and
invalid tool arguments to produce structured errors. The current public docs
define those goals, but the remaining implementation work needs a tighter
contract before coding starts.

## Release relevance

Scope classification: `v0.1 blocker`.

This work maps directly to:

- F-06 tool validation;
- F-11 permission prompt;
- S-05 shell string denial;
- S-06 destructive command denial;
- S-08 no write-capable tools.

## Sources reviewed

- `docs/releases/v0.1.0-contract.md`
- `docs/architecture/v0.1-minimal-coding-agent.md`
- `docs/agent/permission-system.md`
- `docs/agent/tool-protocol.md`
- `docs/engineering/testing-strategy.md`
- `docs/adr/0003-tool-protocol-with-zod.md`
- `docs/adr/0006-permission-gate-before-command-execution.md`

## Industry practice

Comparable agent systems separate tool schema validation, permission decisions,
and execution. The important pattern for v0.1 is not broad automation; it is a
small deterministic gate that cannot be bypassed by provider output.

## Alternatives considered

| Option                                | Description                                       | Decision                                         |
| ------------------------------------- | ------------------------------------------------- | ------------------------------------------------ |
| Deny all restricted commands          | Keep `run_command` unavailable in practice        | Reject: fails F-11                               |
| Prompt-only permission                | Tell the model to ask before commands             | Reject: prompt-only safety is a project non-goal |
| Tool registry owns permission         | Registry denies or executes based on context only | Reject: lacks CLI pause and approval flow        |
| Core permission gate before execution | Agent loop asks a gate before restricted tools    | Accept                                           |

## Trade-off matrix

| Criterion            | Deny all | Prompt-only | Core gate |
| -------------------- | -------- | ----------- | --------- |
| Meets F-11           | No       | No          | Yes       |
| Deterministic safety | High     | Low         | High      |
| CLI complexity       | Low      | Low         | Medium    |
| Testability          | Medium   | Low         | High      |
| v0.1 scope fit       | Partial  | No          | Yes       |

## Project-specific constraints

- v0.1 remains read-only.
- No write-capable tool may be introduced.
- `packages/core` must not import Ink or provider SDK types.
- `packages/tools` must not call providers.
- CLI may render permission prompts, but tool execution stays outside CLI.
- Model-generated tool input must be validated with Zod before policy or
  execution.

## Recommendation

Define a `PermissionGate` contract in core and route every tool call through it
before execution. Read-only tools default to `allow`; `run_command` defaults to
`ask`; dangerous or out-of-scope operations return `deny`.

Tighten tool input schemas so unknown fields are rejected rather than silently
stripped. The runtime JSON schema and Zod schema must agree on
`additionalProperties: false`.

## Acceptance criteria impacted

- F-06: invalid or extra tool args return `tool_validation_error`.
- F-11: restricted commands pause for approval.
- S-05: shell strings are denied before execution.
- S-06: destructive commands are denied before execution.
- S-08: no write-capable tool exists.

## Open questions

- Should v0.1 support one-time approval only, or per-run approval caching?
- Should declined commands be appended to model context as tool results or run
  events only?
- Should live provider runs be allowed to request `run_command`, or should the
  first release keep command approval reachable only through deterministic
  tests?
