# 语言政策

## 目的

本政策定义 `code-agent-harness` 从 `v0.2.1` 起的中文优先文档和汇报规则。它是后续 release contract、research、spec、ADR、checklist、README、CHANGELOG、AGENTS、skills 和 final report 的语言入口。

## 默认语言

- 仓库协作、agent updates、final report 默认中文。
- 新增或重写的文档正文默认中文。
- 核心源码注释默认中文，并使用 UTF-8 编码保存。
- review handoff 默认用中文解释 what、why、how、验证证据和风险。
- 如果用户明确要求其他语言，以用户请求为准，但不改变仓库持久文档的默认语言政策。

## 必须使用中文

以下内容的用户可读正文必须使用中文：

- release note、release contract、release checklist；
- research note、spec、ADR；
- engineering standards、development lifecycle、testing strategy、acceptance、benchmark、code review 等工程文档；
- readiness gap list、migration checklist、manual audit report 等验收文档；
- skills 文档、agent docs、architecture docs；
- README、CHANGELOG、AGENTS 中的项目说明和协作规则；
- Mermaid 图中的用户可读节点；
- 表格字段和说明文字，除非字段本身是技术标识。
- 核心源码注释中的用户可读解释。

## 可保留英文

以下内容应保留原文，不应为了中文化而翻译：

- TypeScript 标识符、函数名、类型名、class 名、schema 名；
- event name、tool name、error kind、trace field 等技术字段；
- 命令、flags、环境变量、路径、文件名、包名；
- API 名称、SDK 名称、协议名、配置 key；
- 外部项目名、组织名、官方页面标题、论文标题和引用标题；
- JSON、YAML、TOML、frontmatter、package metadata 中的字段名；
- 代码块、命令块、diff、日志、trace 示例。

## 源码注释

- 核心逻辑注释使用中文说明 what、why、how。
- 注释目标读者是刚进入仓库的新手；读者应能通过注释理解核心路径如何串起来，而不需要先读完整 release 文档。
- 需要优先覆盖 agent loop、permission gate、tool registry、policy checks、provider adapter、trace redaction、CLI permission flow、smoke/E2E path。
- 注释不得改变运行时行为，也不得把未验证的设计意图写成事实。

## Mermaid 和表格

- Mermaid 图中的用户可读节点优先中文。
- Mermaid 中的代码符号、模块名、package 名和 event name 保留原文。
- 表格列名默认中文；如果列名是固定格式或 review handoff contract，例如 `What changed`、`Why`、`How`、`File:line`、`Review focus`，可以保留英文。
- benchmark metric 可以使用英文 identifier，但必须有中文解释。

## 迁移顺序

1. 先迁移规范入口和模板。
2. 再迁移 release-facing docs。
3. 再迁移仓库 skills 和 engineering docs。
4. 再迁移 agent/tool docs。
5. 再迁移 README/CHANGELOG 中尚未覆盖的历史段落。
6. 最后迁移历史 ADR、research、spec 和旧 release 文档。

`v0.2.1` 当前已完成全仓 Markdown 文档迁移。后续新增或修改文档仍按上述顺序和保护规则执行。

## 风险控制

- 不改变技术含义。
- 不翻译代码符号、命令、路径、包名或 API 名称。
- 不破坏 Markdown 表格、Mermaid、命令块、链接和 frontmatter。
- 不把未运行的 benchmark、E2E 或质量门禁写成已通过。
- 不用批量翻译替代 reviewer audit。
- `bun run audit:language` 是启发式扫描，只用于发现明显英文正文残留和源码注释缺口；它不能替代人工语义审查。

## 验收

一次中文化迁移只有在下列条件满足时才可标记完成：

- 目标文档正文已使用中文。
- 允许保留英文的技术标识未被误翻译。
- Markdown format check 已运行并报告结果。
- 如本次变更影响文档语言或核心源码注释，运行 `bun run audit:language` 并处理 blocker。
- 链接、路径、命令块、Mermaid 和表格经过抽查。
- 未覆盖或暂缓的英文正文被记录在 gap list。
