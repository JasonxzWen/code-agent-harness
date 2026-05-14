# Research baseline

本目录保存 `code-agent-harness` 的公开机制调研基线。`v0.3.1 Research Harness Alignment` 的目标是把 Claude Code / Codex-like runtime mechanisms 拆成可验证的研究主题，并映射到后续 release；它不声明这些能力已经在本项目 runtime 中实现。

调研刷新日期：2026-05-14。

## 使用边界

- 只把公开文档、公开源码、release notes、标准文档和可信工程文章作为事实来源。
- 所有外部产品描述都必须区分 `observation`、`inference` 和 `implementation target`。
- 不写 Claude Code、Codex 或其他闭源产品的内部实现事实。
- 如果本仓库当前是否实现某能力不确定，标注 `needs verification`，不要把计划写成现状。
- 每次 release spec 或 runtime implementation 前，必须刷新与该 release scope 相关的研究文档。

详细规则见 [research-source-policy.md](research-source-policy.md)。

## v0.3.1 新增基线

| 文档                                                                       | 作用                                                                                 | 后续 release 映射                    |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------ |
| [comparative-agent-runtime-matrix.md](comparative-agent-runtime-matrix.md) | 横向对比 Claude Code、Codex 和本项目计划抽象。                                       | v0.4 到 v1.0 的机制路线图入口        |
| [claude-code-memory.md](claude-code-memory.md)                             | 拆解 `CLAUDE.md`、scoped memory 和 auto memory 的公开行为。                          | v0.4 Scoped Instruction & Memory     |
| [claude-code-subagents.md](claude-code-subagents.md)                       | 拆解 Claude Code custom subagents、context isolation 和 foreground/background 运行。 | v0.5 Subagent Runtime                |
| [claude-code-agent-teams.md](claude-code-agent-teams.md)                   | 拆解 Claude Code experimental agent teams、task list 和 mailbox。                    | v0.6 Agent Team Orchestration MVP    |
| [claude-code-hooks.md](claude-code-hooks.md)                               | 拆解 Claude Code lifecycle hooks、decision control 和安全边界。                      | v0.8 Hooks & Lifecycle Automation    |
| [codex-agents-md.md](codex-agents-md.md)                                   | 拆解 Codex `AGENTS.md` discovery、precedence 和 repo guidance。                      | v0.4 Scoped Instruction & Memory     |
| [codex-memories.md](codex-memories.md)                                     | 拆解 Codex memories、thread controls 和 generated state。                            | v0.4 Scoped Instruction & Memory     |
| [codex-skills.md](codex-skills.md)                                         | 拆解 Codex skills 和 progressive disclosure。                                        | v0.7 Skills & Progressive Disclosure |
| [research-source-policy.md](research-source-policy.md)                     | 约束所有 research/spec 使用的证据类型和写作边界。                                    | 所有后续 release                     |

## 已有 research

| 文档                                                   | 当前用途                                                                                |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| [industry-reference-map.md](industry-reference-map.md) | 早期行业参考映射，保留为历史入口。                                                      |
| [comparable-projects.md](comparable-projects.md)       | 早期 comparable-project maturity signal，后续应逐步被矩阵和机制文档替代。               |
| [v0.1/](v0.1/)                                         | v0.1 read-only agent loop、tool validation、permission gate 和 output bounds research。 |
| [v0.2/](v0.2/)                                         | v0.2 controlled `apply_patch` 和 approval workflow research。                           |
| [v0.2.1/](v0.2.1/)                                     | 中文优先仓库迁移 research。                                                             |
| [v0.3/](v0.3/)                                         | deterministic eval harness research 和技术调研 HTML。                                   |

## 当前项目状态摘要

本项目当前已交付 `v0.3.0 Evaluation Harness`。已实现的 runtime 基线包括 minimal agent loop、read tools、tool validation、permission gate、controlled `apply_patch`、JSONL trace 和 deterministic eval reports。

以下能力仍是后续研究目标，不应在文档中写成已实现：persistent memory、product-level subagents、agent teams / orchestration、skills runtime、hooks runtime、MCP integration、permission modes 扩展和 sandbox isolation。

## 推荐阅读顺序

1. 先读 [research-source-policy.md](research-source-policy.md)，确认来源和措辞边界。
2. 再读 [comparative-agent-runtime-matrix.md](comparative-agent-runtime-matrix.md)，获得机制总览。
3. 根据目标 release 读取对应机制文档。
4. 写 release spec 前刷新相关官方页面，并把新增观察追加到对应机制文档或 release research。
