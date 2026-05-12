# 调研：Chinese-first Repository Migration

## 问题

仓库已有“新增 release-facing 文档从 `v0.2.0` 起使用中文正文”的规则，但 README、CHANGELOG、AGENTS、skills、engineering docs、templates、ADR、research 和 spec 的语言边界仍不统一。`v0.2.1` 需要先定义中文优先迁移策略、验收机制和 benchmark 方法，再决定是否批量迁移历史内容。

## Release 相关性

这是 `v0.2.1 Chinese-first Repository Migration` 的核心 release feature。它影响后续所有文档、规范、release contract、research、spec、checklist、ADR、skills 文档和最终汇报，但不改变产品运行时代码。

## 已审阅来源

| Source                              | URL                                                                 | 决策信号                                                                                                                              |
| ----------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| OpenAI Codex AGENTS.md guide        | <https://developers.openai.com/codex/guides/agents-md>              | Codex 会在工作前读取 `AGENTS.md`，并支持 global/project/nested 指令层级；本项目应把语言政策放进 `AGENTS.md` 和 engineering docs。     |
| OpenAI Codex repository AGENTS docs | <https://github.com/openai/codex/blob/main/docs/agents_md.md>       | 官方仓库把详细 AGENTS 行为集中到 docs；本项目应避免把根 `AGENTS.md` 写成巨大手册。                                                    |
| Claude Code project memory docs     | <https://code.claude.com/docs/en/memory>                            | Claude Code 使用 `CLAUDE.md` 和 rules，并建议通过导入 `AGENTS.md` 复用跨工具指令；本项目应让语言规则可被其他 agent 文件复用。         |
| opencode rules docs                 | <https://dev.opencode.ai/docs/rules/>                               | opencode 支持 `AGENTS.md`、fallback 文件和 `opencode.json` 的 instruction list；本项目应把细则拆进 engineering docs，根指令只做入口。 |
| Aider conventions docs              | <https://aider.chat/docs/usage/conventions.html>                    | Aider 允许任意 Markdown convention 文件通过 `--read` 或 config 常驻；本项目可用 `language-policy.md` 作为可复用 convention 文件。     |
| OpenHands contributing docs         | <https://docs.openhands.dev/overview/contributing>                  | 大型 agent 项目把 contribution、quality、docs、research 分成不同贡献路径；本项目迁移也应按文档类别分批执行。                          |
| AGENTS.md standard                  | <https://agents.md/>                                                | `AGENTS.md` 是普通 Markdown，无必填字段，并强调 README 面向人、AGENTS 面向 agent；本项目应保留根指令简洁并链接详细政策。              |
| GitHub Docs contributing            | <https://docs.github.com/en/contributing>                           | 成熟开发者文档有内容模型、style guide 和贡献入口；本项目应把中文化要求放进 standards 和 release docs 标准。                           |
| Read the Docs localization          | <https://docs.readthedocs.com/platform/en/stable/localization.html> | 文档平台建议明确项目语言和翻译项目关系；本项目当前不做双语站点，选择单一中文正文权威源。                                              |

## 行业扫描

| Project                     | 公开语言 / localization 做法                                                        | Repository instruction 做法                                                         | 对本 release 的信号                                                           |
| --------------------------- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Codex                       | 官方开发者文档和仓库文档以英文为主；文档强调 `AGENTS.md` 层级和大小限制。           | `AGENTS.md` 作为项目指令入口，可分层覆盖。                                          | 把中文政策放在根入口和细分 engineering docs；不要把所有规则塞进一个超长文件。 |
| Claude Code                 | 官方 docs 位于 `/docs/en`，页面提供 English 语言入口；项目指令以 `CLAUDE.md` 为主。 | 支持 `CLAUDE.md`、`.claude/rules/`、imports 和组织级规则；可导入 `AGENTS.md` 复用。 | 语言政策应模块化，方便未来为其他 agent 生成 `CLAUDE.md` 或 import。           |
| opencode                    | 官方 docs 英文为主。                                                                | 支持 `AGENTS.md`、`CLAUDE.md` fallback 和 `opencode.json` instruction list。        | 本项目应使用统一 `AGENTS.md` 加详细 docs，而不是为每个工具复制完整规则。      |
| Aider                       | 官方 docs 英文为主。                                                                | 使用 conventions 文件和 `.aider.conf.yml` 读取 Markdown 指令。                      | `language-policy.md` 可作为可读、可审计、可被其他工具加载的规范文件。         |
| OpenHands                   | 官方 docs 英文为主，贡献路径覆盖代码、文档、研究和质量。                            | 贡献 docs 明确开发环境、PR、测试和文档路径。                                        | 中文迁移应像 release 工程一样分阶段，不应一次性改全仓。                       |
| AGENTS.md standard          | 标准本身强调普通 Markdown 和跨 agent 兼容。                                         | README 面向人，AGENTS 面向 agent，可用 nested 文件。                                | 根 `AGENTS.md` 应保持简洁，详细语言政策放在 `docs/engineering/`。             |
| GitHub Docs / Read the Docs | 成熟 docs 系统将主语言、翻译、style guide、贡献流程分开管理。                       | 通过内容模型和贡献指南控制文档质量。                                                | 当前阶段先做单一中文权威源和 manual audit；多语言流水线暂缓。                 |

## 行业实践

主流 coding agent 项目没有把所有项目文档翻译成多语言的统一做法。更稳定的共性是：

- 使用 Markdown instruction 文件承载项目约定。
- 保持根指令短小，详细规则放到可引用文档。
- 通过 scope、fallback、imports 或 config list 复用规则。
- 让文档语言政策服务于 agent 行为和 contributor onboarding，而不是作为独立翻译项目。
- 对多语言文档使用明确的主语言、翻译边界和维护流程，避免多个版本同时成为权威源。

## 已考虑备选方案

| Option 选项                               | Benefit 收益             | Cost 成本                                             | Decision 决策 |
| ----------------------------------------- | ------------------------ | ----------------------------------------------------- | ------------- |
| 一次性批量翻译全仓                        | 立刻形成视觉一致性       | 语义漂移、Markdown/Mermaid 破坏、review 难度过高      | v0.2.1 拒绝   |
| 中英双语并行维护                          | 对外部贡献者友好         | 高维护成本，容易出现两个权威源                        | 暂缓          |
| 只在 `AGENTS.md` 写一句中文要求           | 快速                     | 不能指导 release docs、benchmark、templates 和 skills | 不足够        |
| 先建语言政策、spec、checklist，再分批迁移 | 可审计、scope 小、风险低 | 中文化覆盖率不是本阶段完成                            | 推荐          |

## 取舍矩阵

| Criterion 指标     | Policy-first migration | Bulk translation | Bilingual docs |
| ------------------ | ---------------------- | ---------------- | -------------- |
| Scope control      | 高                     | 低               | 中             |
| Reviewability      | 高                     | 低               | 中             |
| Drift risk         | 低                     | 高               | 高             |
| Immediate coverage | 中                     | 高               | 高             |
| Maintenance cost   | 中                     | 高               | 高             |
| Fits v0.2.1        | 是                     | 否               | 否             |

## 项目特定约束

- `v0.2.1` 不改变产品功能代码。
- v0.2 PR #6 已合并进 `origin/main`，本 release 可基于 `origin/main` 继续。
- 现有 docs 中已经有中文 release documentation standard，但 README、CHANGELOG、部分 engineering docs 和 skills 仍为英文正文。
- 质量门禁必须如实报告；未运行的扫描、E2E 或 benchmark 不能写成通过。
- 迁移必须保护代码标识符、命令、路径、包名、外部项目名、引用标题、API 名称和 trace/event 名称。

## 建议

采用 policy-first migration：

1. 在 `v0.2.1` 建立中文优先 release contract、research、spec、checklist 和 `language-policy.md`。
2. 只更新必要入口文档，让后续 agent session 能发现规则。
3. 后续经批准后按类别迁移：模板、release-facing docs、engineering docs、agent/tool docs、skills、README/CHANGELOG/AGENTS、历史 ADR/research/spec。
4. 在实现自动扫描前，使用 manual audit benchmark 量化覆盖率和剩余英文正文清单。

## 受影响的验收标准

- 后续新增文档正文默认中文。
- final report 和 review handoff 默认中文解释，保留必要英文表头或代码标识符。
- release docs 必须记录语言审计、E2E 场景、benchmark question、metrics、manual audit 方法和剩余 gap。
- 任何批量迁移必须先保护 Markdown 表格、Mermaid、命令块和链接。

## 开放问题

- 是否需要在后续阶段实现自动文档语言扫描脚本。
- README 和 CHANGELOG 已在 `v0.2.1` 第一批迁移中处理；后续问题是是否需要更细的历史条目复审。
- 是否需要为外部贡献者保留一份英文 `CONTRIBUTING` 摘要。
- 历史 ADR/research/spec 是否全文翻译，还是保留英文原文并增加中文摘要和状态标记。
