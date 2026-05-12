# 规格：TUI Permission and Run Interaction

## Scope classification

`v0.1 blocker`

本 spec 只定义 CLI interaction contracts。除非明确请求 implementation，否则它不授权 implementation。

## Problem

CLI 是 v0.1 的 user-facing surface。它必须可靠启动、接受 task、render run progress、处理 permission requests、显示 final answer，并允许 abort，同时不能把 business logic 移入 TUI。

## User-facing behavior

- User 可以启动 `agent-harness`。
- User 可以提交 task。
- Run progress 以 events 或 status lines 可见。
- Restricted command requests 显示 command details，并要求 approve/deny。
- Denied permission 作为 run event 可见，且不 execute command。
- User 可以 abort running task。
- Final answer 会 render inspected paths。

## Internal design

CLI 观察并提供交互，但不 execute tools。

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

CLI 可以提供：

```ts
interface CliPermissionAdapter extends PermissionGate {
  check(request: PermissionRequest): Promise<PermissionDecision>;
}
```

CLI 必须 consume provider-neutral run events，而不是 provider SDK objects。

## Data/state model

CLI-rendered state 包括：

- draft task；
- submitted task；
- run id；
- recent events；
- pending permission request；
- final answer；
- error；
- abort status。

CLI 不得拥有 display state 之外的 tool output。

## Error handling

| Case                    | Required behavior                               |
| ----------------------- | ----------------------------------------------- |
| Provider failure        | Render structured failure 结果                  |
| Tool validation failure | Render event，并让 loop policy 决定后续处理     |
| Permission denied       | Render denial，并按 core state continue/fail    |
| User abort              | Mark run aborted，并停止后续 provider/tool work |
| Trace write failure     | Render failure，不隐藏 root cause               |

## Permission / security considerations

- Permission prompt 必须 display requested tool 和 input summary。
- Approval 不能覆盖 deterministic command policy。
- CLI 不得在 prompt 或 trace 中 expose secret values。
- Denied permission 不得 execute tools。

## Testing plan

Required tests：

- CLI renders initial task input；
- submitted task 到达 run state；
- pending permission request 可被 rendered；
- approve decision 返回 `allow`；
- deny decision returns `deny`；
- denied command is not executed；
- abort 改变 run state 并 stops further steps；
- final answer 渲染 inspected paths。

## Documentation impact

Implementation 完成后更新这些文档：

- `docs/examples/v0.1-demo-script.md`
- `docs/architecture/v0.1-minimal-coding-agent.md`
- `docs/agent/permission-system.md`
- `README.md`，如果 CLI usage 改变

## Acceptance criteria

满足以下条件时，本 spec 被 accepted：

- F-01、F-02、F-11、F-13 和 F-14 有 test 或 smoke evidence；
- CLI 仍不直接 execute tools；
- core 仍不 import Ink；
- `bun run quality` passes。

## Non-goals

- background task mode；
- IDE extension；
- rich dashboard UI；
- command history persistence；
- multi-agent UI；
- patch approval UI。

## Rollout plan

1. 定义 core permission request events。
2. Add CLI permission adapter。
3. 添加 input、permission、final 和 abort states 的 focused render tests。
4. 如果 usage 改变，更新 demo script 和 README。
5. 运行 quality gates 并记录 release evidence。
