# Claude Code subagents

本文拆解 Claude Code subagents 的公开行为，并映射到 `code-agent-harness` 的 `v0.5 Subagent Runtime`。它不描述 Claude Code 的闭源内部实现。

调研刷新日期：2026-05-14。

## Public behavior

Claude Code 官方文档描述 custom subagents 是可配置的 specialized AI assistants。每个 subagent 可以有 purpose、description、system prompt、独立 context window 和工具权限。Subagent 配置可位于 project scope 或 user scope，通常以 Markdown frontmatter 加正文 prompt 表达。

公开行为还包括：

- 可通过 `/agents` 管理和选择 subagents；
- 可通过 `@agent-name` 或自然语言显式调用；
- 可通过 `--agent <name>` 让主会话以某个 subagent 身份启动；
- foreground subagents 会阻塞主对话并传递 permission prompts；
- background subagents 可并发运行，但通常使用已授予权限，并自动拒绝需要新交互批准的 tool call；
- subagents 适合隔离高输出任务、并行 research 或链式工作。

## Design inference

本项目的设计推断是：subagent runtime 不是普通 tool call。它需要同时处理 context isolation、role-specific instruction、permission inheritance、result summarization 和 parent-child trace linking。

Subagent 的价值来自“把噪声和上下文膨胀隔离到 child context”，不是来自更多模型调用本身。风险是 delegated result 缺少证据、child 权限过宽、parent 误合并不可靠结论，或多个 child 修改同一文件。

## What this project will reproduce

`v0.5` 计划复现最小本地 deterministic subagent runtime：

- 定义 subagent task input 和 bounded output schema；
- 为 child run 建立独立 context snapshot；
- 记录 parent-child trace link；
- 支持 foreground-only 的第一版执行；
- 明确 subagent 不能绕过 parent permission policy；
- eval 覆盖 exploration、review 和 failing-child summary。

## What this project will not reproduce

- 不复现 Claude Code subagent file format 或 CLI 命令。
- 不实现 background daemon、真实云并发或无限 agent tree。
- 不让 subagent 自动扩大工具权限。
- 不实现任意 agent marketplace。
- 不在 v0.5 处理多 worktree 写入隔离，除非 spec 明确升级 scope。

## Minimal runtime components

- `SubagentDefinition`：name、description、instructions、allowedTools、model profile placeholder。
- `SubagentTask`：parent run id、task prompt、context budget、expected output schema。
- `SubagentRunner`：启动 deterministic child run 并返回 summary。
- `SubagentResult`：status、summary、evidence refs、error、trace path。
- `ParentAggregator`：合并 child result，不直接信任未带 evidence 的结论。

## Trace events to collect

- `subagent.spawn_requested`
- `subagent.spawned`
- `subagent.context_prepared`
- `subagent.tool_permission_inherited`
- `subagent.completed`
- `subagent.failed`
- `subagent.result_summarized`
- `subagent.closed`

## Failure modes

- child context 缺少关键 repo guidance，导致结论偏离。
- subagent 返回自然语言结论但没有 evidence refs。
- parent 把 child failure 合并成 success。
- child 请求的权限超出 parent 当前 policy。
- 并发 child 输出互相矛盾但未标记。
- child 产生大量 output，summary 截断关键失败。

## Security and privacy concerns

- Subagent 不能继承更高权限或绕过 parent permission gate。
- Child trace 应遵守与 parent 相同的 secret redaction。
- Child task input 不应包含不必要的敏感上下文。
- 对写操作，第一版应默认不允许 child 直接修改，或要求严格 ownership。

## Eval ideas

- Exploration fixture：child 只读模块 A，parent 合并 summary。
- Failure fixture：child 被要求运行禁止命令，断言 permission denied 并向 parent 传播。
- Evidence fixture：child summary 缺少 file refs 时 aggregator 标记 incomplete。
- Conflict fixture：两个 child 返回相反结论，parent 必须列出 conflict 而不是选择一个。
- Context fixture：child context snapshot 不含 unrelated conversation history。

## Interview explanation

可以这样解释：subagent 是一个有独立上下文和职责边界的 child run。它和 tool call 的区别是：tool call 通常执行一个确定动作并返回结果，subagent 会自己规划、读文件、调用工具并产出摘要。因此 runtime 需要记录它拿到了什么上下文、用了哪些工具、是否失败，以及 parent 如何合并它的结论。

## Open questions

- v0.5 第一版是否允许 subagent 写文件，还是只读探索和 review？
- 是否需要固定内置角色，例如 `explorer`、`reviewer`、`test_runner`？
- 是否需要 child trace 合并到 parent report，还是只保留 link？
- Subagent output schema 应该是通用 summary，还是按 role 定义？
- 如何衡量 subagent 是否减少 parent context pollution？

## Sources

| Source                                       | Type          | Used for                                                                                                      |
| -------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------- |
| <https://code.claude.com/docs/en/sub-agents> | official docs | Claude Code custom subagents、context isolation、tool permissions、foreground/background 和 common patterns。 |
| <https://code.claude.com/docs/en/agents>     | official docs | Claude Code parallel agent approaches comparison。                                                            |
