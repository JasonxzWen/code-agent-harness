# 项目章程

## 使命

构建一个 release-driven coding agent harness，面向真实仓库，具备透明的运行时契约、安全的 tool execution、可观察的 agent behavior，以及 terminal-first developer experience。

## 产品原则

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
- context management；
- permission systems；
- event logging；
- quality gates；
- release documentation；
- extensible architecture。

## 非目标

- chatbot UI；
- general-purpose assistant；
- web demo；
- uncontrolled shell automation；
- hidden persistent memory；
- core runtime 存在前的 broad integrations。

## 公开接口

以下内容视为 public contracts：

- CLI behavior；
- config schema；
- tool protocol；
- provider contract；
- event schema；
- release notes；
- docs 和 ADRs。
