---
name: implementation-quality
description: 实施已批准变更时使用，确保 coding、tests、docs、quality gates、self-review 和 final report 一致完成。
---

## 语言政策

- 在本仓库中，面向用户的输出和新增文档使用中文。
- 代码标识符、命令、路径、包名、API 名称、外部项目名和来源标题保留原文。
- final reports、review handoffs、release evidence 和 benchmark notes 遵守 `docs/engineering/language-policy.md`。

## 实施工作流

1. 阅读已批准的 spec 或 release contract。
2. 编辑前检查相关文件。
3. 只做聚焦变更。
4. 为 success 和 failure paths 新增或更新测试。
5. 如果 public behavior 变化，更新 docs。
6. 对用户可见 feature，更新或新增 E2E acceptance evidence。release feature 不能只靠 unit tests，除非例外已记录。
7. 对 release feature，更新 benchmark evidence：benchmark question、metric、fixture、command 或 artifact、threshold、result、peer baseline 和 caveats。
8. 运行 quality gates：
   - `bun run format:check`
   - `bun run lint`
   - `bun run typecheck`
   - `bun run test`
   - `bun run smoke`
   - `bun run quality`
9. 尽可能修复失败。
10. 使用 `docs/engineering/code-review.md` 自审 diff。
11. 对 release work、Ralph loop、跨多文件实现、跨模块重构、agent workflow/skill/规范更新、用户明确要求 HTML 汇报，或用户要求“review 核心逻辑 / 面试怎么讲 / 系统位置图 / 代码 walkthrough”的任务，加载 `html-work-reports` skill，并生成 self-contained HTML 变更汇报，默认写入 `.agent-harness/reports/latest/change-report.html`。优先使用 `html-work-reports` 的结构化 JSON 输入、`scripts/create-report.mjs` 和 `scripts/validate-html-report.mjs`，并在报告中说明目标、scope、what/why/how、review focus、真实 quality gates、E2E/benchmark evidence、limitations、git 状态。涉及代码 review 的报告必须直接贴出高亮代码/diff 证据；涉及系统位置、模块关系或数据流的报告必须包含已渲染 Mermaid 图或明确降级原因。若 browser 校验降级或未生成报告，必须在 final report 中说明原因。
12. 返回最终汇报，包含 HTML report path、review-focused change points、file and line number references、quality gate table、self-review、limitations 和 next step。每个 change point 必须用 plain language 说明 what changed、why changed、how it works，再指向实现位置。这是 Feynman-style handoff：reviewer 不需要先读完整 diff，也应能理解变更、设计选择和验证方式。请求人工审查时，不要使用 bare files-changed list 作为主交接。

不要声称未实际运行的命令通过。
