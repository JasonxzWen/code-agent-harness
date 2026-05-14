# Claude Code agent teams

本文拆解 Claude Code agent teams 的公开行为，并映射到 `code-agent-harness` 的 `v0.6 Agent Team Orchestration MVP`。它不描述 Claude Code 的闭源内部实现。

调研刷新日期：2026-05-14。

## Public behavior

Claude Code 官方文档描述 agent teams 是 experimental 且默认关闭的能力。启用后，一个 lead session 可以创建多个 teammates，协调任务、分配工作并综合结果。Teammates 是独立 Claude Code instances，各自有 context window，并可直接互相通信。

公开文档把 agent teams 与 subagents 区分开：subagents 通常在一个 session 内做 side task 并向 caller 汇报；agent teams 有 shared task list、mailbox 和 teammate-to-teammate messaging，更适合需要讨论、挑战假设或跨层协调的并行工作。

文档也列出限制：session resumption、task status lag、shutdown、one team per session、no nested teams、fixed lead 和 split-pane 环境依赖等都存在已知边界。

## Design inference

本项目的设计推断是：agent team orchestration 的核心不是“多开几个 subagent”，而是共享 state 和通信协议。

最小可研究对象包括：

- team lead 如何创建和命名 workers；
- task list 如何表达 ownership、blocked、done 和 stale；
- mailbox 如何让 workers 互相传递事实，而不是所有信息都经由 lead；
- final aggregation 如何保留 disagreement 和 evidence；
- shutdown / recovery 如何可见。

## What this project will reproduce

`v0.6` 计划复现一个小型 orchestration MVP：

- lead + teammates 的本地状态模型；
- task list：open、claimed、blocked、done、failed；
- mailbox messages：sender、recipient、topic、body、evidence refs；
- progress events；
- final aggregation report；
- deterministic fixtures 覆盖并行 research、stale task 和 conflicting findings。

## What this project will not reproduce

- 不复现 Claude Code agent teams UI、tmux / pane orchestration 或 exact storage path。
- 不实现真实后台进程管理或多终端 session host。
- 不实现 nested teams。
- 不实现复杂 scheduler 或组织级权限模型。
- 不把 experimental 外部能力直接写成稳定本项目目标。

## Minimal runtime components

- `TeamDefinition`：lead、members、role descriptions 和 limits。
- `TaskListStore`：本地 deterministic task state。
- `MailboxStore`：append-only inter-agent messages。
- `TeamOrchestrator`：spawn、assign、wait、nudge、shutdown。
- `AggregationPolicy`：整理 results、conflicts、unresolved tasks 和 evidence。

## Trace events to collect

- `team.created`
- `team.member_spawned`
- `team.task_created`
- `team.task_claimed`
- `team.task_blocked`
- `team.task_completed`
- `team.mailbox_message_sent`
- `team.mailbox_message_received`
- `team.member_idle`
- `team.shutdown_requested`
- `team.aggregation_completed`

## Failure modes

- teammate 没有标记 task done，导致 dependent task 卡住。
- 多个 teammate 编辑同一文件，造成冲突。
- mailbox 消息丢失或未被接收者处理。
- lead 过早 shutdown。
- teammate 需要额外权限但无人响应。
- final aggregation 隐藏 disagreement。

## Security and privacy concerns

- Teammates 不应默认获得比 lead 更高的权限。
- mailbox 可能包含 sensitive context，report 中只能显示 bounded excerpts。
- task list 和 mailbox 如写入本地文件，应明确 repo-local / generated artifact 边界。
- Team orchestration 不应自动 commit、push 或创建 PR。

## Eval ideas

- Parallel review fixture：三个 teammates 分别检查安全、测试和维护性，final report 保留每个 evidence。
- Disagreement fixture：两个 teammates 对 root cause 有冲突结论，aggregation 标记 unresolved。
- Stale task fixture：一个 task claimed 后无结果，orchestrator 记录 stale 并 nudge。
- Permission fixture：teammate 请求写操作，被 parent policy 拒绝。
- Shutdown fixture：lead shutdown 前必须列出 incomplete tasks。

## Interview explanation

可以这样解释：agent teams 研究的是“协作协议”，不是模型数量。一个 team runtime 必须能表达任务归属、消息传递、进度、失败和汇总。没有这些状态，多 agent 只是多个独立对话，无法审计谁负责什么、哪些事实被共享、哪些任务仍未完成。

## Open questions

- v0.6 是否基于 v0.5 subagent runner，还是先做模拟 teammates？
- mailbox 是否需要 durable JSONL，还是只作为 trace events？
- 是否需要 worktree isolation 才允许 teammates 写文件？
- lead 是否可以直接修改 task state，还是只通过 events 派生？
- HTML report 是否应展示 team graph 和 mailbox transcript？

## Sources

| Source                                        | Type          | Used for                                                                                  |
| --------------------------------------------- | ------------- | ----------------------------------------------------------------------------------------- |
| <https://code.claude.com/docs/en/agent-teams> | official docs | Claude Code agent teams、lead/teammates、task list、mailbox、permissions 和 limitations。 |
| <https://code.claude.com/docs/en/agents>      | official docs | Claude Code parallelization approach comparison。                                         |
