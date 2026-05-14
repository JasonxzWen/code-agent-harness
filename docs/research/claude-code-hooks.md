# Claude Code hooks

本文拆解 Claude Code hooks 的公开行为，并映射到 `code-agent-harness` 的 `v0.8 Hooks & Lifecycle Automation`。它不描述 Claude Code 的闭源内部实现。

调研刷新日期：2026-05-14。

## Public behavior

Claude Code 官方文档描述 hooks 是 lifecycle automation：用户可在 settings files 或 subagent frontmatter 中配置 hook，在 tool use、session start、prompt submit、stop、setup、instructions loaded 等事件上运行 command 或 MCP tool。

公开行为包括：

- hooks 按 event 和 matcher 配置；
- hook input 通过 JSON 提供；
- exit code 和 JSON output 可影响是否 block、是否继续、是否把 context 注入 Claude；
- `PreToolUse`、`PostToolUse`、`Stop`、`SubagentStop` 等事件有不同控制语义；
- `InstructionsLoaded` 可观察 instruction files 何时加载；
- 文档明确提醒 hooks 会自动执行 shell commands，用户需要审查、测试和限制脚本。

## Design inference

本项目的设计推断是：hooks 是确定生命周期上的 automation boundary，不是普通 instructions。它适合表达“每次写文件后运行 formatter check”这类固定行为，因为 hooks 不依赖模型是否记得执行。

风险也更硬：hook 是 side-effecting automation，可能读写文件、泄露环境变量、误删数据或隐藏失败。因此 hooks runtime 必须有显式配置、dry-run、timeout、trace、failure policy 和禁用路径。

## What this project will reproduce

`v0.8` 计划复现可审计的 lifecycle hooks：

- `pre-run`
- `post-tool`
- `post-edit`
- `pre-final`
- `post-report`

每个 hook 都应有 command schema、input schema、timeout、working directory、allowed side effects、failure policy 和 trace evidence。

## What this project will not reproduce

- 不复现 Claude Code hook event 名称或完整 schema。
- 不支持任意全局 shell hook。
- 不允许 hook 绕过 permission gate。
- 不做后台 daemon。
- 不让 hook 在未记录 trace 的情况下修改工作区。

## Minimal runtime components

- `HookDefinition`：event、matcher、command/tool、timeout、failure policy。
- `HookRunner`：构造 JSON input、执行 hook、解析 exit code/JSON output。
- `HookPolicy`：决定 hook 是否可运行、是否可写、是否需要 approval。
- `HookTrace`：记录 start、output summary、decision、duration 和 failure。
- `HookReportAdapter`：把 hook-generated artifacts 映射到 HTML handoff report。

## Trace events to collect

- `hook.discovered`
- `hook.started`
- `hook.completed`
- `hook.failed`
- `hook.blocked`
- `hook.skipped`
- `hook.output_context_added`
- `hook.artifact_recorded`

## Failure modes

- hook 脚本找不到依赖，阻塞正常工作。
- hook 修改文件但未在 trace 中记录。
- hook output 过大或包含 secret。
- `PreToolUse` 误以为是完整 enforcement boundary，但同等行为可通过其他 tool path 发生。
- hook 配置变更在会话中未生效，用户误判。
- 多个 hooks 并发或顺序不清，造成竞态。

## Security and privacy concerns

- hooks 可执行 shell command，应默认最小权限。
- hook input/output 必须 redaction。
- hook command 应避免 shell string 注入和 path traversal。
- hook-generated artifact 不应包含本机绝对路径或 secret。
- reviewer 必须能看到 hook 是否运行、失败和跳过。

## Eval ideas

- Post-edit fixture：编辑后 hook 运行 formatter check，trace 记录 pass。
- Blocking fixture：pre-run hook 返回 block，agent 停止并给出 reason。
- Timeout fixture：hook 超时，按 policy fail 或 warn。
- Secret fixture：hook output 含 token-looking value，report 中被 redacted。
- Bypass fixture：配置不匹配时 hook skipped，trace 写明 matcher miss。

## Interview explanation

可以这样解释：instructions 是“告诉模型应该怎么做”，hooks 是“在固定生命周期点由 runtime 执行检查或自动化”。可靠 agent runtime 需要两者：instructions 给策略和偏好，hooks 给可重复、可审计的执行点。但 hooks 也更危险，所以必须有权限、超时、trace 和失败策略。

## Open questions

- v0.8 第一版是否只允许 read-only hooks？
- hook command 是否应复用现有 `run_command` allowlist？
- hook failure policy 是 per-hook 定义，还是按 event 默认？
- 是否需要支持 hook 注入 extra context？
- `html-work-reports` 是否应作为 `post-report` hook 的示例 fixture？

## Sources

| Source                                       | Type          | Used for                                                                                                |
| -------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------- |
| <https://code.claude.com/docs/en/hooks>      | official docs | Claude Code hook events、input/output、decision control、security considerations 和 execution details。 |
| <https://code.claude.com/docs/en/sub-agents> | official docs | Subagent frontmatter hooks and `SubagentStop` behavior。                                                |
