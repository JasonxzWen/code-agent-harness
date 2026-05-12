# 发布文档标准

本标准约束每个正式 release 的用户可读文档。目标是让 release note 成为一份
完整的顶级报告：集调研、需求分析、技术选型、实现说明、验收和 benchmark
于一体。用户应当能在不读完整代码库的情况下，理解本次 release 提供了什么、
为什么这样做、关键逻辑在哪里、如何验证效果，以及它和主流 coding-agent
项目的方案差异。

## 适用范围

- 每个 `docs/releases/vX.Y.Z.md` 必须遵守本标准。
- 如果 release 改变公开行为、运行时契约、工具协议、安全策略或用户工作流，必须同步更新相关 contract、spec、research、ADR 或 checklist。
- 从 `v0.2.0` 开始，新增的 release note、release contract、release checklist、spec、research note 和 ADR 必须以中文作为正文语言。代码标识符、命令、包名、源项目名和英文引用标题可以保留原文。
- 从 `v0.2.1` 开始，中文优先规则扩展到 README、CHANGELOG、AGENTS.md、engineering docs、agent docs、templates 和 skills 文档。详细规则见 `docs/engineering/language-policy.md`。

## 必需内容

每个 release note 必须包含以下内容：

| 内容                   | 要求                                                                                                            |
| ---------------------- | --------------------------------------------------------------------------------------------------------------- |
| 摘要                   | 用用户能理解的语言说明本次 release 解决了什么问题。                                                             |
| Feature 验收卡         | 每个 feature 必须说明是什么、用户需求、主要场景、行业做法、我们的做法、为什么、如何实现、e2e 验收和 benchmark。 |
| Mermaid 变更图         | 至少一张 `mermaid` 图，展示本次 release 的运行流、模块变化或能力边界。                                          |
| 关键逻辑和代码定义索引 | 列出关键逻辑、符号名、文件路径、用途；代码片段必须和真实导出名保持一致。                                        |
| 实现原因               | 说明为什么采用当前方案，以及拒绝了哪些替代方案。                                                                |
| 行业方案对照           | 对照 Codex、Claude Code、opencode、OpenClaw、Hermes Agent 等相关项目；写明外部方案、我们的方案和取舍原因。      |
| E2E 验收               | 记录用户入口到最终结果的完整验收场景、命令、fixture、trace 或人工步骤。                                         |
| Benchmark              | 记录 benchmark question、样本、指标、命令、阈值、结果、限制，以及和竞品实践或执行结果的对照。                   |
| 质量证据               | 列出实际运行过的质量门禁，不得声称未运行的命令通过。                                                            |
| 限制和下一步           | 明确当前 release 不做什么，以及下一版本候选方向。                                                               |

Feature 验收卡和 benchmark 规则遵守
`docs/engineering/acceptance-and-benchmarking.md`。

## 关键逻辑索引规则

- 使用仓库内真实路径和真实导出名，例如 `packages/core/src/agent-loop.ts` 的 `runAgentTask`。
- 面向用户解释职责，不复制大段源码。
- 当文档示例和实际类型不一致时，以实际代码为准并修正文档。
- 代码片段只保留能说明契约的最小片段，避免把 release note 变成源码转储。

## 行业对照规则

- 对照材料优先使用官方文档、官方仓库、官方 README 或项目维护者文档。
- 每次 release 开发前必须刷新对照项，避免沿用可能过时的描述。
- 刷新范围至少包含 OpenAI Codex、Claude Code 和 opencode；如果 release
  涉及编辑、sandbox、多 agent、memory、MCP、长期任务或工具权限，还必须加入
  Aider、OpenHands、OpenClaw、Hermes Agent 或其他直接相关项目。
- 调研结果必须进入 `docs/research/<release>/...` 或清楚引用已刷新的全局
  research map，不能只在最终 release note 中补一张对照表。
- 不因为成熟项目有某项能力就自动扩大本项目 scope。所有外部信号必须映射到本项目 release 决策。

## 发布门禁

发布前必须确认：

```txt
[ ] release note 使用本标准结构
[ ] 至少一张 Mermaid 图存在并能表达本次变更
[ ] 每个 feature 有验收卡，说明 what、user need、primary scenario、industry practice、our approach、why、how、e2e acceptance、benchmark
[ ] features、关键逻辑、代码定义位置已列清楚
[ ] 实现原因和替代方案已说明
[ ] 行业方案对照已刷新并列出来源
[ ] e2e 级别验收已运行或明确记录为 blocker/例外
[ ] benchmark question、metrics、commands、results 和 caveats 已记录
[ ] 质量门禁结果记录准确
[ ] v0.2.0 起新增发布文档使用中文
```
