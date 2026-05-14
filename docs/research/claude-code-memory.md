# Claude Code memory

本文拆解 Claude Code memory 的公开行为，并映射到 `code-agent-harness` 的 `v0.4 Scoped Instruction & Memory`。它不描述 Claude Code 的闭源内部实现。

调研刷新日期：2026-05-14。

## Public behavior

Claude Code 官方文档描述了多层 memory：enterprise policy、project memory、user memory 和 local memory。项目级 `CLAUDE.md` 可随仓库共享，用户级 memory 保存个人偏好，local memory 用于不提交的本地说明。

Claude Code 会从当前工作目录向上查找 `CLAUDE.md` / `CLAUDE.local.md`，也会在读取子目录文件时按需加载嵌套 memory。`/memory` 可查看当前会话加载的 memory、打开文件并控制 auto memory。文档还描述了 auto memory：当用户要求 Claude 记住偏好或工作流时，Claude 可保存 plain markdown memory，用户可以审计、编辑或删除。

公开文档明确提醒：`CLAUDE.md` 内容作为 user message 注入，不等同于 system prompt；如果某条规则必须在固定生命周期点执行，应该用 hook，而不是只依赖 memory。

## Design inference

本项目的设计推断是：memory 机制至少包含三个边界，而不是一个“长 prompt 文件”。

- Scope boundary：哪些目录、用户或组织层级的规则适用。
- Injection boundary：哪些 memory 进入当前 run，以及以什么来源和优先级进入。
- Audit boundary：用户如何知道 memory 被加载、何时加载、为什么加载，以及如何删除或修正。

auto memory 的核心价值不是让 agent 无限自我画像，而是减少重复上下文输入；风险是把短期会话、错误推断或敏感信息变成后续默认上下文。

## What this project will reproduce

`v0.4` 只复现可见、可审查、repo-local 的 scoped instruction and memory path：

- 支持 checked-in instruction 文件和本地 memory fixture；
- 记录每个加载项的 source path、scope、precedence、load reason 和 byte/token budget；
- 提供 explicit inclusion / exclusion trace；
- 在 eval 中覆盖 conflicting instructions、nested scope、missing memory 和 oversized memory。

## What this project will not reproduce

- 不实现 Claude Code memory 文件格式兼容层。
- 不实现云同步、组织托管 memory 或跨用户画像。
- 不实现隐式 auto memory generation 作为 v0.4 P0。
- 不把 conversation-only hint 自动提升为长期规则。
- 不声称复现 Claude Code 的 prompt 拼接、排序或压缩内部实现。

## Minimal runtime components

- `InstructionSource`：描述 file path、scope、kind、mtime/hash 和 repo-relative location。
- `InstructionResolver`：按 cwd 和 project root 解析候选文件。
- `MemoryResolver`：显式读取允许的 local memory entries。
- `ContextInjectionPlan`：记录最终注入顺序、截断、排除原因和冲突摘要。
- `TraceEmitter`：写入 `instruction.loaded`、`memory.loaded`、`memory.skipped` 和 `context.injection_planned`。

## Trace events to collect

- `instruction.discovered`
- `instruction.loaded`
- `instruction.skipped`
- `memory.discovered`
- `memory.loaded`
- `memory.skipped`
- `context.injection_planned`
- `context.injection_truncated`
- `instruction.conflict_detected`

## Failure modes

- 更近目录的规则没有覆盖上层规则。
- local memory 被误提交或误当成 team rule。
- auto memory 保存了错误偏好或敏感路径。
- 文件过大导致关键指令被截断。
- compaction 后 instruction reload 行为与用户预期不一致。
- 多个 memory 文件互相冲突，agent 无法稳定遵循。

## Security and privacy concerns

- memory 可能包含 secret、客户名、内部路径或个人偏好。
- auto memory 生成不能绕过用户的显式控制。
- trace 只能记录 bounded metadata，不应写入完整敏感 memory 内容。
- 本项目第一版应默认 opt-in，并把 checked-in team rules 与 user-local recall 分开。

## Eval ideas

- Fixture repo：root 和 nested `AGENTS.md` / future memory file 同时存在，断言 precedence。
- Conflict case：两个 scope 对同一 formatter 给出不同命令，断言 trace 标记冲突。
- Privacy case：memory 中含 token-looking value，断言 trace redaction。
- Oversize case：长 memory 触发 truncation，断言保留 source metadata 和 warning。
- Re-run case：同一任务在有/无 memory 下输出 evidence 差异。

## Interview explanation

可以这样解释：memory 不是“让模型更聪明的隐藏笔记”，而是一个带 scope、加载规则、审计记录和隐私边界的 context source。可靠的 runtime 不应该让 memory 悄悄改变行为；它应该能回答“加载了什么、为什么加载、来自哪里、是否被截断、如果错了怎么修”。

## Open questions

- v0.4 是否应该只支持 `AGENTS.md`，还是同时定义本项目自己的 memory file？
- 是否需要 `memory.local.md` 这类不提交文件的约定？
- auto memory 是否只写 research/spec，不进入 runtime P0？
- memory conflict 应仅 trace warning，还是阻塞 run？
- 是否需要在 HTML eval report 中展示 memory inclusion graph？

## Sources

| Source                                   | Type          | Used for                                                                                     |
| ---------------------------------------- | ------------- | -------------------------------------------------------------------------------------------- |
| <https://code.claude.com/docs/en/memory> | official docs | `CLAUDE.md` memory types、lookup、`/memory`、auto memory、troubleshooting 和 hook boundary。 |
| <https://code.claude.com/docs/en/hooks>  | official docs | `InstructionsLoaded` hook 和 lifecycle enforcement boundary。                                |
