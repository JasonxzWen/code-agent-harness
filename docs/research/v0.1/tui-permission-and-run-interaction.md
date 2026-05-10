# Research: TUI Permission and Run Interaction

## Problem

v0.1 is terminal-first and includes permission prompts, event rendering, final
answers, and abort behavior. PermissionGate work affects the user interaction
contract, so the CLI needs a spec before implementation begins.

## Release relevance

Scope classification: `v0.1 blocker`.

This work maps to:

- F-01 CLI starts;
- F-02 task submission;
- F-11 permission prompt;
- F-13 trace visibility;
- F-14 abort.

## Sources reviewed

- `docs/releases/v0.1.0-contract.md`
- `docs/architecture/v0.1-minimal-coding-agent.md`
- `docs/agent/agent-loop.md`
- `docs/agent/permission-system.md`
- `docs/engineering/testing-strategy.md`
- `docs/examples/v0.1-demo-script.md`

## Industry practice

Terminal-first agent tools usually keep the runtime independent from UI
rendering. The TUI should observe run state and provide user decisions, while
core owns orchestration and tools own execution.

## Alternatives considered

| Option                             | Description                               | Decision                          |
| ---------------------------------- | ----------------------------------------- | --------------------------------- |
| CLI executes tools directly        | Handle prompt and execution in UI         | Reject: violates package boundary |
| Core imports Ink prompt components | Put UI in core loop                       | Reject: violates package boundary |
| CLI supplies a permission adapter  | UI renders prompt, core consumes decision | Accept                            |
| Defer permission UI                | Keep commands denied in v0.1              | Reject: fails F-11                |

## Trade-off matrix

| Criterion        | CLI executes tools | Core imports Ink | CLI adapter |
| ---------------- | ------------------ | ---------------- | ----------- |
| Package boundary | Low                | Low              | High        |
| Meets F-11       | Yes                | Yes              | Yes         |
| Testability      | Low                | Medium           | High        |
| v0.1 scope fit   | Low                | Low              | High        |

## Project-specific constraints

- `apps/cli` may render UI and gather input.
- `apps/cli` must not execute tools directly.
- `packages/core` must not import Ink.
- Permission decisions must be traceable.
- Abort must stop the run without creating write behavior.

## Recommendation

Use a CLI-owned permission adapter that implements the provider-neutral
`PermissionGate` contract. The adapter renders the pending request, collects an
approve/deny decision, and returns that decision to core.

The TUI should render:

- initial task input;
- running event stream;
- pending permission request;
- final answer;
- structured failure state;
- aborted state.

## Acceptance criteria impacted

- F-01: CLI starts.
- F-02: task appears in run state.
- F-11: restricted command prompts for approval.
- F-13: trace includes run and permission events.
- F-14: abort stops run.

## Open questions

- Should v0.1 approval controls be keyboard shortcuts, explicit buttons, or
  typed commands?
- Should the initial v0.1 TUI support interactive permission approval in live
  provider runs, or only deterministic mock runs?
- What minimum render test proves the prompt is reachable?
