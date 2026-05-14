# Codex memories

本文拆解 Codex memories 的公开行为，并映射到 `code-agent-harness` 的 `v0.4 Scoped Instruction & Memory`。它不描述 Codex 的闭源内部实现。

调研刷新日期：2026-05-14。

## Public behavior

OpenAI Codex 官方文档描述 memories 是 local recall layer：启用后，Codex 可以把 prior threads 中稳定且有用的上下文带入未来工作。文档列举的适用内容包括 stable preferences、recurring workflows、tech stacks、project conventions 和 known pitfalls。

公开行为包括：

- memories 需要在 Codex app settings 或 `config.toml` feature flag 中启用；
- Codex 会从 eligible prior threads 生成 local memory files；
- active 或 short-lived sessions 会被跳过；
- generated memory fields 会 redacts secrets；
- memory generation 可延迟到 thread idle 后，也可能因 rate-limit threshold 跳过；
- memory files 默认位于 Codex home 下的 `memories/`；
- `/memories` 可控制当前 thread 是否使用已有 memories，以及当前 thread 是否可用于生成未来 memories；
- 官方文档建议强制 team guidance 放进 `AGENTS.md` 或 checked-in docs，而不是只依赖 memories。

关于 memory proposal：本次刷新未在所查官方页面中确认一个稳定的交互式 proposal contract。后续 release spec 前应标注 `needs verification` 并重新检查官方 docs / app behavior。

## Design inference

本项目的设计推断是：Codex memories 把“项目永久规则”和“本地回忆”分开。`AGENTS.md` 更适合团队必须遵守的规则；memories 更适合个人或本机复用的历史偏好。

对本项目来说，关键研究点是 provenance 和 opt-in：memory 从哪里来、是否允许用于当前 run、是否允许把当前 run 变成未来 memory input，以及 redaction 是否可验证。

## What this project will reproduce

`v0.4` 计划复现最小 explicit memory layer：

- 仅从 repo-local fixture 或用户显式指定文件读取 memory；
- 记录 memory source、scope、hash、inclusion reason 和 skipped reason；
- 支持 per-run use-memory 开关；
- 把 memory 作为可审查 context source，而不是隐藏 state；
- eval 覆盖 secret redaction 和 memory disabled cases。

## What this project will not reproduce

- 不实现 Codex memory directory layout 兼容。
- 不实现 background memory extraction。
- 不实现 rate-limit-aware memory consolidation。
- 不实现 Chronicle 或 screen-based recovery。
- 不实现 memory proposal UI，除非后续官方资料和 release scope 明确批准。

## Minimal runtime components

- `MemoryConfig`：useMemory、generateMemoryInput、allowedSources。
- `MemorySource`：path、scope、kind、hash、createdAt placeholder。
- `MemoryLoader`：读取并校验 memory text。
- `MemoryRedactor`：对 trace/report 做 secret-like redaction。
- `MemoryDecisionTrace`：记录 use/skip/generate-disabled 原因。

## Trace events to collect

- `memory.config_resolved`
- `memory.source_discovered`
- `memory.loaded`
- `memory.skipped`
- `memory.redaction_applied`
- `memory.disabled_for_run`
- `memory.generation_candidate_recorded`
- `memory.generation_skipped`

## Failure modes

- 用户以为 team rule 一定生效，但它只存在 local memory。
- generated memory 保存了错误推断。
- memory 含 secret 或本机绝对路径。
- 当前 thread 使用了外部敏感 context，却仍进入 memory generation input。
- memory 延迟更新导致用户误判新偏好已生效。
- memory disabled 与 use-existing-memory 开关混淆。

## Security and privacy concerns

- 默认不应把 prior thread 内容写入长期 memory。
- Memory trace 只记录 metadata 和 redaction result。
- 在共享 Codex home 或导出 artifact 前需要审查 memory files。
- 本项目不应把 memory 作为绕过 repo instructions 的高优先级 source。

## Eval ideas

- Disabled fixture：memory 文件存在但 per-run disabled，断言不进入 context。
- Secret fixture：memory 有 token-looking value，trace/report redacted。
- Provenance fixture：多个 memory source，report 显示来源和 inclusion reason。
- Team-rule fixture：规则只在 memory 中，eval 标记不应作为 mandatory rule。
- External-context fixture：模拟外部 context，generation candidate skipped。

## Interview explanation

可以这样解释：Codex memories 是本地 recall layer，不是项目规则的唯一来源。一个研究型 runtime 第一版应该先做“显式读取、显式跳过、显式审计”，而不是直接做自动总结。否则 debug 时无法解释模型为什么突然遵循某个历史偏好。

## Open questions

- 是否需要本项目自己的 `.agent-harness/memories/` fixture 目录？
- auto memory 是否永远留在 outside-product scope，只作为研究对比？
- memory generation candidate 是否需要 trace，但不实际写文件？
- memory 与 `AGENTS.md` 冲突时谁优先？
- memory proposal UI contract 是否存在稳定官方定义：needs verification。

## Sources

| Source                                                       | Type          | Used for                                                                                             |
| ------------------------------------------------------------ | ------------- | ---------------------------------------------------------------------------------------------------- |
| <https://developers.openai.com/codex/memories>               | official docs | Codex memories enablement、generation、storage、thread controls、configuration 和 privacy guidance。 |
| <https://developers.openai.com/codex/concepts/customization> | official docs | Codex customization layers and distinction between `AGENTS.md` and memories。                        |
