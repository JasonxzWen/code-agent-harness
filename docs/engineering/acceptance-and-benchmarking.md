# 验收与 Benchmark 标准

本标准约束每个 release feature 的验收、e2e 验证和 benchmark 报告。目标是让
release 文档不仅说明“做了什么”，还说明“为什么值得做、相对竞品怎么取舍、
效果如何量化、用户如何相信它已经可用”。

## Feature 验收卡

每个 release feature 都必须有一张验收卡，至少回答：

| 字段              | 必填内容                                                          |
| ----------------- | ----------------------------------------------------------------- |
| Feature           | 这个功能是什么，用户会感知到什么变化。                            |
| User need         | 它解决的用户需求、痛点或工作流风险。                              |
| Primary scenario  | 本项目最主要的使用场景，避免泛化成所有 coding agent 场景。        |
| Industry practice | Codex、Claude Code、opencode 等竞品或同类项目怎么做。             |
| Our approach      | 本项目怎么做，和竞品相比取舍是什么。                              |
| Why               | 为什么这个方案适合当前 release、当前用户场景和当前安全边界。      |
| How               | 关键实现路径、代码入口和数据流。                                  |
| E2E acceptance    | 从用户入口到结果的完整验收方式、命令、fixture、trace 或人工步骤。 |
| Benchmark         | 可量化指标、样本、命令、结果、阈值和与竞品或行业实践的对照方式。  |
| Limitations       | 当前不覆盖的场景，特别是无法直接和竞品运行比较的原因。            |

## 验收层级

Unit tests 只证明局部逻辑正确，不能单独支撑一个用户可见 release feature。
用户可见 feature 至少需要以下层级：

| 层级        | 目的                                         | 例子                                                            |
| ----------- | -------------------------------------------- | --------------------------------------------------------------- |
| Unit        | 验证纯逻辑、schema、policy、parser。         | path policy、patch parser、Zod validation。                     |
| Integration | 验证包边界内多个模块和 fixture repo 的协作。 | tool registry + real tools against a temp git repo。            |
| E2E         | 验证用户入口到最终结果的完整 workflow。      | CLI/smoke run、approval flow、trace、final answer。             |
| Benchmark   | 量化功能效果和安全边界，并和竞品实践对照。   | scenario matrix pass rate、safety denial rate、trace coverage。 |

如果当前实现只有 unit tests，没有 integration 或 E2E 级别验收，则 release
readiness 必须记录为 blocker，除非该 feature 不是用户可见行为，并且例外理由
写入 spec 和 release note。

## Benchmark 机制

每个 benchmark 必须先定义问题，再定义指标。不要先跑脚本再解释数字。

必须记录：

- benchmark question：这个 benchmark 要回答什么问题；
- primary scenario：为什么这个场景代表本项目的主要使用方式；
- peer baseline：竞品或同类项目的公开做法、能力边界或可运行对照；
- dataset / fixtures：本地 fixture、任务集、失败路径矩阵或真实样例；
- metrics：成功率、失败率、误拒率、误放行率、输出完整性、trace 覆盖、
  运行时间、tool-call 数量等；
- commands / artifacts：如何复现，输出保存在何处；
- thresholds：发布前最低接受线；
- result：实际结果，不得声称未运行的 benchmark 通过；
- caveats：无法直接运行竞品、API key 不可用、样本太小等限制。

竞品对照分两类：

1. Practice comparison：基于官方文档、官方仓库或维护者材料，说明对方怎么
   设计该能力。
2. Executed comparison：在可复现条件下运行同类任务，记录命令、版本、输入、
   输出和指标。

如果没有实际运行竞品，不得写成性能排名或绝对优劣。可以写成“行业实践对照”
和“本项目本地 benchmark 结果”。

## Release 报告要求

正式 release note 应当是一份完整报告，而不是 changelog。它必须整合：

- 调研：看了哪些竞品或同类项目，得到什么设计信号；
- 需求分析：目标用户、主要场景、痛点和非目标；
- 技术选型：考虑过哪些方案，为什么选当前方案；
- 实现说明：关键路径、模块边界、数据流和安全边界；
- 验收与 benchmark：e2e 场景、指标、命令、结果和限制；
- 后续计划：哪些能力因 scope 或风险被推迟。

## 最小表格模板

```md
| Feature | User need / scenario | Industry practice | Our approach | Why | How | E2E acceptance | Benchmark |
| ------- | -------------------- | ----------------- | ------------ | --- | --- | -------------- | --------- |
|         |                      |                   |              |     |     |                |           |
```
