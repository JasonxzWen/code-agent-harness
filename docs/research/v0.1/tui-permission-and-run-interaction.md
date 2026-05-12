# 调研：TUI Permission and Run Interaction

## Problem

v0.1 是 terminal-first，并包含 permission prompts、event rendering、final answers 和 abort behavior。PermissionGate work 会影响 user interaction contract，因此 CLI 需要在 implementation 前拥有 spec。

## Release relevance

Scope classification：`v0.1 blocker`。

本工作映射到：

- F-01 CLI starts；
- F-02 task submission；
- F-11 permission prompt；
- F-13 trace visibility；
- F-14 abort。

## Sources reviewed

- `docs/releases/v0.1.0-contract.md`
- `docs/architecture/v0.1-minimal-coding-agent.md`
- `docs/agent/agent-loop.md`
- `docs/agent/permission-system.md`
- `docs/engineering/testing-strategy.md`
- `docs/examples/v0.1-demo-script.md`

## Industry practice

Terminal-first agent tools 通常让 runtime 独立于 UI rendering。TUI 应 observe run state 并提供 user decisions；core 拥有 orchestration，tools 拥有 execution。

## Alternatives considered

| Option                             | Description                             | Decision                    |
| ---------------------------------- | --------------------------------------- | --------------------------- |
| CLI executes tools directly        | 在 UI 中处理 prompt 和 execution        | 拒绝：违反 package boundary |
| Core imports Ink prompt components | 把 UI 放进 core loop                    | 拒绝：违反 package boundary |
| CLI supplies a permission adapter  | UI render prompt，core consume decision | 采用                        |
| Defer permission UI                | v0.1 保持 commands denied               | 拒绝：不满足 F-11           |

## Trade-off matrix

| Criterion 指标   | CLI executes tools | Core imports Ink | CLI adapter |
| ---------------- | ------------------ | ---------------- | ----------- |
| Package boundary | 低                 | 低               | 高          |
| Meets F-11       | 是                 | 是               | 是          |
| Testability      | 低                 | 中               | 高          |
| v0.1 scope fit   | 低                 | 低               | 高          |

## Project-specific constraints

- `apps/cli` 可以 render UI 和 gather input。
- `apps/cli` 不得直接 execute tools。
- `packages/core` 不得 import Ink。
- Permission decisions 必须 traceable。
- Abort 必须 stop the run，且不创建 write behavior。

## Recommendation

使用 CLI-owned permission adapter 实现 provider-neutral `PermissionGate` contract。adapter render pending request，收集 approve/deny decision，并把 decision 返回给 core。

TUI 应 render：

- initial task input；
- running event stream；
- pending permission request；
- final answer；
- structured failure state；
- aborted state。

## Acceptance criteria impacted

- F-01：CLI starts。
- F-02：task appears in run state。
- F-11：restricted command prompts for approval 已覆盖。
- F-13：trace includes run and permission events 已覆盖。
- F-14：abort stops run。

## Open questions

- v0.1 approval controls 应是 keyboard shortcuts、explicit buttons，还是 typed commands？
- 初始 v0.1 TUI 是否支持 live provider runs 中的 interactive permission approval，还是只支持 deterministic mock runs？
- 哪个 minimum render test 能证明 prompt reachable？
