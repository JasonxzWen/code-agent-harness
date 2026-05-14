# 项目章程

## 使命

构建一个 TypeScript Coding Agent Runtime Research Harness，用 learning-by-building 的方式研究现代 coding agent 的 scoped instructions、memory、subagents、orchestration、skills、hooks、permissions、trace 和 eval。

本项目面向真实仓库和 terminal-first developer workflow，通过可运行的最小 runtime slice、deterministic tests、event trace、eval evidence 和 release handoff reports，理解 Claude Code / Codex-like tools 的 public behavior 和 design inference。

## 产品原则

- Research clarity 优先于 feature breadth。
- Learning-by-building 优先于纯文档调研。
- 可运行优先于看起来宏大。
- Release 纪律优先于宽泛野心。
- 小契约优先于大抽象。
- Deterministic safety 优先于 prompt-only safety。
- 可追踪行为优先于黑箱自动化。
- 从第一个 release 开始准备 evaluation readiness。
- Terminal-first 开发者 workflow。

## 本项目展示什么

- agent loop design；
- tool orchestration；
- provider abstraction；
- scoped instruction loading；
- context management；
- memory boundary design；
- subagent context isolation；
- task orchestration and mailbox protocol；
- skills and progressive disclosure；
- lifecycle hook design；
- permission systems；
- event logging；
- deterministic eval；
- quality gates；
- release documentation；
- extensible architecture。

## 当前已实现基线

- `v0.1 Minimal Agent Loop`：read tools、tool validation、permission gate 和 JSONL trace。
- `v0.2 Patch-capable Agent`：受控 `apply_patch`、permission preview、显式 approval 和 patch policy tests。
- `v0.3 Evaluation Harness`：deterministic eval harness、JSONL trace parsing、JSON / Markdown / HTML reports。

## 当前未实现能力

以下仍是后续研究目标，不是当前 runtime 能力：

- persistent memory；
- product-level subagents；
- multi-agent orchestration；
- skills runtime；
- lifecycle hooks runtime；
- advanced permission modes；
- sandbox-lite；
- MCP integration。

## 非目标

- Claude Code clone；
- Codex clone；
- Devin clone；
- production IDE agent；
- benchmark suite；
- demo website；
- chatbot UI；
- general-purpose assistant；
- uncontrolled shell automation；
- hidden persistent memory；
- 未经 spec 的 broad integrations；
- 描述 Claude Code、Codex 或其他闭源产品的内部实现。

## 公开接口

以下内容视为 public contracts：

- CLI behavior；
- config schema；
- tool protocol；
- provider contract；
- event schema；
- eval report schema；
- release notes；
- docs 和 ADRs。

## Evidence Contract

每个 release 都必须留下可审查证据：

- research question 和 public behavior boundary；
- spec 或 release contract；
- tests；
- eval evidence、trace 或 artifact；
- HTML handoff report；
- known limitations；
- review focus anchors。
