# Spec: Permission Gate and Strict Tool Validation

## Scope classification

`v0.1 blocker`

This spec is documentation and implementation planning only. It does not
authorize coding until implementation is explicitly requested.

## Problem

The v0.1 contract requires validated tool calls, read-only command safety, and a
permission prompt before restricted command execution. The implementation must
make those guarantees enforceable in code, not dependent on model behavior.

## User-facing behavior

- Read-only tools run without prompting.
- A restricted command request pauses the run and asks the user to approve or
  deny it.
- Denied commands produce a structured tool result and a trace event.
- Invalid tool input produces a structured validation error.
- Final answers must not claim that denied or invalid tools executed.

## Internal design

The agent loop must evaluate every provider tool call in this order:

```txt
provider tool call
→ normalize to internal ToolCall
→ validate input with strict Zod schema
→ evaluate deterministic tool policy
→ evaluate permission gate
→ execute only if allowed
→ append structured result
→ write trace event
```

The permission gate belongs in `packages/core` as a provider-agnostic contract.
The CLI may supply an implementation that renders prompts, but `packages/core`
must not import Ink.

`packages/tools` owns tool schemas, path policy, command policy, and execution.
It must not know about providers or TUI rendering.

## APIs / contracts

Proposed core contract:

```ts
export type PermissionDecision = "allow" | "ask" | "deny";

export interface PermissionRequest {
  runId: string;
  toolName: string;
  input: JsonObject;
  reason?: string;
}

export interface PermissionGate {
  check(request: PermissionRequest): Promise<PermissionDecision>;
}
```

Tool definitions must declare their default permission:

```ts
defaultPermission: PermissionDecision;
```

Runtime validation requirement:

```txt
Zod schema rejects unknown keys.
JSON schema declares additionalProperties: false.
Validation failure returns tool_validation_error.
```

## Data/state model

Permission-related run state must include:

- pending permission request;
- approved or denied decision;
- tool call id;
- structured result for denied calls;
- trace events for request, decision, and completion.

No permission state may persist across process runs in v0.1.

## Error handling

| Case                     | Required error kind        |
| ------------------------ | -------------------------- |
| Unknown tool             | `tool_validation_error`    |
| Invalid schema input     | `tool_validation_error`    |
| Extra schema input       | `tool_validation_error`    |
| Denied permission        | `permission_denied`        |
| Path policy violation    | `path_policy_violation`    |
| Secret path violation    | `secret_policy_violation`  |
| Command policy violation | `command_policy_violation` |
| Tool execution failure   | `tool_execution_error`     |

## Permission/security considerations

- Permission is evaluated after schema validation and before execution.
- Permission approval cannot override deterministic safety policy.
- Shell strings remain forbidden.
- Destructive commands remain forbidden.
- File editing, patch application, and write commands remain out of scope.
- A denied tool call must be visible in trace output.

## Testing plan

Required tests before implementation can be considered complete:

- strict schema rejects unknown input fields;
- unknown tool returns `tool_validation_error`;
- invalid args return `tool_validation_error`;
- read-only tools pass with `allow`;
- `run_command` creates an `ask` permission request;
- approved read-only command executes;
- denied command does not execute;
- destructive command is denied even if permission would allow;
- shell-token command is denied;
- denied command result is appended to run context;
- permission events are written to JSONL trace.

## Documentation impact

Update these documents when implementation is complete:

- `docs/agent/permission-system.md`
- `docs/agent/tool-protocol.md`
- `docs/architecture/v0.1-minimal-coding-agent.md`
- `docs/engineering/testing-strategy.md`
- `docs/releases/v0.1.0-contract.md`, only if the public contract changes

## Acceptance criteria

This spec is accepted when:

- the above test plan is represented in tests;
- `bun run quality` passes;
- no v0.2+ feature is introduced;
- release checklist marks F-06, F-11, S-05, S-06, and S-08 as satisfied.

## Non-goals

- command write support;
- patch application;
- persistent permission memory;
- background approval;
- MCP permission integration;
- sandbox runtime;
- provider-specific permission behavior.

## Rollout plan

1. Implement strict schemas and registry validation tests.
2. Add provider-agnostic `PermissionGate` contract in core.
3. Add CLI permission prompt adapter without moving execution into CLI.
4. Add trace events for permission request and decision.
5. Run full quality gates.
6. Update release readiness checklist with evidence.
