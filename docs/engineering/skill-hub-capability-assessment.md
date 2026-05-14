# Skill Hub 能力评估

## 目的

记录 2026-05-14 对 [`JasonxzWen/skill-hub`](https://github.com/JasonxzWen/skill-hub) 的能力复查结果，特别是哪些内容适合补强 `code-agent-harness` 的 agent 工作流。上游快照：`42c3065`。

## 结论

本轮只直接采用 `html-work-reports`。原因是本仓库已经有 v0.3 JSON / Markdown / HTML eval report 和开发完成 HTML 汇报规范，但缺少可复用的项目级 skill、模板、生成器和 validator。直接补上这条能力能提升交接质量，同时不改变产品运行时代码。

其他 Skill Hub 能力暂不批量引入。它们大多已被 `implementation-quality`、`release-readiness`、`research-spec`、仓库工程文档或 Codex 全局能力覆盖；批量安装会增加 trigger 噪音，并可能扩大当前 release-driven 工作边界。

## 已采用能力

| 上游能力            | 本仓库落点                          | 采用理由                                                                                    |
| ------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------- |
| `html-work-reports` | `.agents/skills/html-work-reports/` | 补齐完成汇报的结构化生成、静态模板、source-linked evidence、validator 和 browser 降级记录。 |

## 候选但暂缓

| 上游能力                                          | 判断       | 暂缓原因                                                                                                                                              |
| ------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `skill-evaluator`                                 | 后续可考虑 | 本轮已经完成一次人工定向评估；如果后续频繁比较第三方 skill repo，再抽成正式评估 skill。                                                               |
| `agent-introspection-debugging`                   | 后续可考虑 | 对 agent/tool failure 有价值，但当前本仓库已有严格 trace、smoke、quality gate 和 review 流程，尚未形成独立高频需求。                                  |
| `compound-code-review`                            | 后续可考虑 | 深度 review 能力有价值，但本仓库已经在 `docs/engineering/code-review.md`、`AGENTS.md` 和实现质量 skill 中固定了 findings-first 与 file:line handoff。 |
| `diagnose` / `verification-loop` / `tdd-workflow` | 暂不拆分   | 这些规则已经被 `implementation-quality` 合并承载；拆成多个默认 skill 可能让触发路径变复杂。                                                           |
| `openspec-*`                                      | 暂不采用   | 本仓库当前使用 `docs/research`、`docs/specs` 和 release contract，不引入 OpenSpec 生命周期作为默认流程。                                              |
| `harness` profile                                 | 暂不采用   | 本仓库本身就是 agent harness，已有 `.agent-harness`、quality gates、eval runner 和 release docs；整套模板会重复。                                     |
| web/frontend skills                               | 暂不采用   | 当前任务是工作汇报和 agent workflow，不是产品 UI 或 web app 开发。                                                                                    |

## 对 HTML 汇报的增强点

- 新增独立 skill 入口，让未来用户明确要求 HTML 汇报时可以直接触发。
- 使用结构化 JSON 输入生成报告，避免每次手写静态页面导致格式和证据不一致。
- validator 检查 root、非空内容、Markdown/Mermaid/code/diff 渲染、evidence、verification、交互控件和 reduced-motion。
- browser 校验可以降级，但必须记录真实原因，不能把未运行写成通过。
- 报告默认使用 repo-relative path，不写本机私有绝对路径或无关机器信息。

## 后续触发条件

只有出现下列情况时，才考虑继续从 Skill Hub 引入其他能力：

- 反复需要评估第三方 skill repo，且每次都要记录采纳、拒绝、license、覆盖差异和验证证据。
- 反复出现 agent 自身工具失败、循环、漂移或可恢复错误，需要专门诊断流程。
- 审查复杂度上升到需要 persona-based review、稳定 finding 编号、autofix mode 或独立 artifact handoff。
- 项目正式采用 OpenSpec 生命周期，而不只是维护 Markdown spec 和 release contract。
