# Spec: TUI Permission and Run Interaction

## Scope classification

`v0.1 blocker`

This spec defines CLI interaction contracts only. It does not authorize
implementation until explicitly requested.

## Problem

The CLI is the user-facing surface for v0.1. It must start reliably, accept a
task, render run progress, handle permission requests, show the final answer,
and allow abort without moving business logic into the TUI.

## User-facing behavior

- User can start `agent-harness`.
- User can submit a task.
- Run progress is visible as events or status lines.
- Restricted command requests show command details and require approve/deny.
- Denied permission is visible as a run event and does not execute the command.
- User can abort a running task.
- Final answer is rendered with inspected paths.

## Internal design

The CLI observes and supplies interaction, but it does not execute tools.

```txt
CLI task input
→ core run start
→ core emits events
→ CLI renders events
→ core requests permission
→ CLI permission adapter gathers decision
→ core continues or records denial
→ CLI renders final/failed/aborted state
```

## APIs / contracts

The CLI may provide:

```ts
interface CliPermissionAdapter extends PermissionGate {
  check(request: PermissionRequest): Promise<PermissionDecision>;
}
```

The CLI must consume provider-neutral run events rather than provider SDK
objects.

## Data/state model

CLI-rendered state includes:

- draft task;
- submitted task;
- run id;
- recent events;
- pending permission request;
- final answer;
- error;
- abort status.

The CLI must not own tool output beyond display state.

## Error handling

| Case                    | Required behavior                                    |
| ----------------------- | ---------------------------------------------------- |
| Provider failure        | Render structured failure                            |
| Tool validation failure | Render event and allow loop policy to decide         |
| Permission denied       | Render denial and continue/fail per core state       |
| User abort              | Mark run aborted and stop further provider/tool work |
| Trace write failure     | Render failure without hiding root cause             |

## Permission/security considerations

- Permission prompt must display the requested tool and input summary.
- Approval must not override deterministic command policy.
- CLI must not expose secret values in the prompt or trace.
- Denied permission must not execute tools.

## Testing plan

Required tests:

- CLI renders initial task input;
- submitted task reaches run state;
- pending permission request can be rendered;
- approve decision returns `allow`;
- deny decision returns `deny`;
- denied command is not executed;
- abort changes run state and stops further steps;
- final answer renders inspected paths.

## Documentation impact

Update these documents when implementation is complete:

- `docs/examples/v0.1-demo-script.md`
- `docs/architecture/v0.1-minimal-coding-agent.md`
- `docs/agent/permission-system.md`
- `README.md`, if CLI usage changes

## Acceptance criteria

This spec is accepted when:

- F-01, F-02, F-11, F-13, and F-14 have test or smoke evidence;
- CLI still does not execute tools directly;
- core still does not import Ink;
- `bun run quality` passes.

## Non-goals

- background task mode;
- IDE extension;
- rich dashboard UI;
- command history persistence;
- multi-agent UI;
- patch approval UI.

## Rollout plan

1. Define core permission request events.
2. Add CLI permission adapter.
3. Add focused render tests for input, permission, final, and abort states.
4. Update demo script and README if usage changes.
5. Run quality gates and record release evidence.
