# Codex AGENTS.md

本文拆解 Codex `AGENTS.md` 的公开行为，并映射到 `code-agent-harness` 的 `v0.4 Scoped Instruction & Memory`。它不描述 Codex 的闭源内部实现。

调研刷新日期：2026-05-14。

## Public behavior

OpenAI Codex 官方文档描述 `AGENTS.md` 是项目 guidance 文件：Codex 在工作前读取它，用于稳定传达 build/test commands、review expectations、repo conventions 和 directory-specific instructions。

公开行为包括：

- Codex 会组合 global scope 和 project scope guidance；
- project guidance 从 project root 到当前工作目录逐层发现；
- `AGENTS.override.md` 可覆盖同层 `AGENTS.md`；
- fallback 文件名可通过配置参与发现；
- 更接近 current working directory 的文件表达更局部的规则；
- 文档建议保持 `AGENTS.md` 简洁，把经常重复的 review feedback、routing guidance 和 repo-specific conventions 固化进去。

Codex customization 文档还把 `AGENTS.md`、memories、skills、MCP 和 subagents 描述为互补层：`AGENTS.md` shaping behavior，memories carry context forward，skills package workflows。

## Design inference

本项目的设计推断是：`AGENTS.md` 类机制的关键是 deterministic discovery 和 visible precedence，而不是把一个 Markdown 文件塞进 prompt。

一个可验证 implementation target 应能回答：

- 哪些文件被发现？
- 为什么某个文件被包含或跳过？
- 同层 override 如何处理？
- nested instruction 如何覆盖或补充上层 instruction？
- 进入 context 的内容是否被截断？

## What this project will reproduce

`v0.4` 计划复现 repo-local instruction discovery：

- 从 project root 到 cwd 发现 `AGENTS.md`；
- 支持 nested scope；
- 记录 source、scope、precedence 和 load reason；
- 对 conflicting guidance 产出 trace warning；
- 在 report 中显示 instruction chain。

## What this project will not reproduce

- 不保证兼容 Codex 全部 config keys 或 fallback filename 行为。
- 不复现 Codex global home directory 层级。
- 不实现 cloud task、GitHub comment 更新 `AGENTS.md` 或 automation drift check。
- 不把 `AGENTS.md` 写成 system prompt 等价物。
- 不声称复现 Codex 的完整 prompt assembly。

## Minimal runtime components

- `ProjectRootResolver`：确定 repo root 和 cwd。
- `AgentInstructionFile`：描述 path、scope、override status 和 hash。
- `InstructionChainBuilder`：构造 ordered guidance chain。
- `InstructionConflictDetector`：检测同一 policy key 或 command 的冲突。
- `InstructionTraceAdapter`：输出 discovered / loaded / skipped events。

## Trace events to collect

- `agents_md.search_started`
- `agents_md.discovered`
- `agents_md.override_selected`
- `agents_md.loaded`
- `agents_md.skipped`
- `agents_md.conflict_detected`
- `agents_md.chain_finalized`
- `context.instruction_budget_applied`

## Failure modes

- cwd 不在 Git root 下，root detection 与用户预期不一致。
- override 文件存在但空，fallback 行为不清。
- nested `AGENTS.md` 与 root guidance 冲突。
- 文件过大导致关键命令被截断。
- 用户把必须由 code/policy enforce 的规则只写进 `AGENTS.md`。

## Security and privacy concerns

- `AGENTS.md` 是 repo content，可能来自不可信仓库；不能直接授权工具执行。
- Markdown 中的命令样例不等于允许执行。
- Trace 应记录 file path 和 hash，不默认记录完整内容。
- 对 malicious instructions，应由 higher-level system/developer constraints 和 tool policy 兜底。

## Eval ideas

- Root-only fixture：只存在 root `AGENTS.md`，断言加载。
- Nested fixture：root 和 package-level `AGENTS.md` 同时存在，断言顺序。
- Override fixture：同层 `AGENTS.override.md` 存在，断言选择 override。
- Conflict fixture：两层给出不同 test command，断言 warning。
- Untrusted fixture：`AGENTS.md` 要求 destructive command，断言 permission policy 拒绝。

## Interview explanation

可以这样解释：`AGENTS.md` 是 repo-scoped instruction source。可靠 runtime 不应该只说“我读了文件”，而要让 discovery、precedence、conflict 和 budget 都可验证。它提供默认行为和项目知识，但不能代替权限系统、hooks 或测试。

## Open questions

- v0.4 是否支持 `AGENTS.override.md`，还是只支持 `AGENTS.md`？
- 是否需要 fallback filenames？
- instruction conflict detection 是否应基于简单字符串规则，还是只做人工可读 warning？
- HTML report 是否展示 instruction chain 的内容摘要？
- 与 future memory file 的 precedence 如何定义？

## Sources

| Source                                                       | Type          | Used for                                                     |
| ------------------------------------------------------------ | ------------- | ------------------------------------------------------------ |
| <https://developers.openai.com/codex/guides/agents-md>       | official docs | Codex `AGENTS.md` discovery、scope、override 和 precedence。 |
| <https://developers.openai.com/codex/concepts/customization> | official docs | Codex customization layers and `AGENTS.md` usage guidance。  |
