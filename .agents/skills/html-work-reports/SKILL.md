---
name: html-work-reports
description: 当已完成的非平凡任务需要自包含 HTML 汇报、审查报告、计划说明、状态看板、调研解释、架构 walkthrough 或轻量导出页时使用；不要用于权限暂停、简单聊天回答、生产 UI、slide deck 或打包 web app。
---

# HTML 工作汇报

## 目标

把已经完成或已经形成结论的工作沉淀为一个可本地打开、可审查、可携带的 `.html`。它服务于审查和交接，不替代 chat final report、release note、PR description、JSON report 或真实质量门禁。

## 何时使用

使用本 skill：

- 用户明确要求 HTML 汇报、工作报告、review report、status dashboard、research explainer、architecture walkthrough 或轻量导出页。
- 非平凡任务已经完成，结论包含变更点、取舍、代码证据、质量门禁、E2E/benchmark evidence、风险或下一步。
- Markdown 回复会变成长表格、长 Mermaid、长代码片段或难以扫描的审查材料。

不要使用本 skill：

- 还在等待权限批准、安装确认、push/PR 发布确认、付费操作确认或第三方资源变更确认。
- 简短回答、单命令结果、微小修复或普通聊天总结。
- 正在实现或调试中，尚未形成稳定结论。
- 产品 UI、网站、应用、slide deck 或需要 React/Tailwind/Vite 打包的复杂 artifact。

## 输出契约

- 本仓库默认写入 `.agent-harness/reports/latest/change-report.html`；临时或历史版本可写入 `.agent-harness/reports/<YYYYMMDD-HHMM>-<slug>/change-report.html`。
- 报告必须是 self-contained static HTML，默认不依赖外部 CSS、JS、image、CDN 或 hosted service。
- 报告正文默认中文；代码标识符、命令、路径、API、event name、tool name、外部项目名和引用标题保留原文。
- 先给结论：完成状态、核心判断、最高风险、下一步。
- 对代码或文档变更，必须包含 repo-relative `file:line`、决定性片段或 diff、review focus 和验证证据。
- 对复杂路径、架构、流程或数据流，优先渲染 Mermaid，同时保留可审查的 source fallback。
- 不得声称未运行的 quality gate、E2E、benchmark 或 browser smoke 已通过。
- 不写入 secret、token-looking value、用户主目录、本机私有绝对路径或与审查无关的机器信息。

## 生成器优先工作流

优先使用本 skill 自带生成器和校验器：

1. 根据 `references/report-input-schema.json` 准备结构化 JSON 输入。
2. 运行：

```bash
node .agents/skills/html-work-reports/scripts/create-report.mjs --input <input.json> --out-dir .agent-harness/reports/latest --slug change-report --json
```

3. 运行：

```bash
node .agents/skills/html-work-reports/scripts/validate-html-report.mjs .agent-harness/reports/latest/change-report.html --json
```

4. 如果浏览器自动化不可用，可以用 `--skip-browser` 降级，但 final report 和 HTML report 都要说明降级原因。
5. 只有在模板无法表达任务时才手写 HTML；手写时仍复用 `assets/components/` 的静态组件，并运行 validator。

## 模板选择

直接使用 `assets/templates/` 手写报告时，必须先替换占位文本，并把用户可见正文本地化为中文。优先使用生成器，因为生成器会按结构化输入输出本仓库约定的中文审查视图。

- `implementation-handoff`：实现完成交接、变更点、文件证据、验证、风险和下一步。
- `review-findings`：代码审查、PR 审查、风险分级、owner 和行动项导出。
- `research-explainer`：调研综合、架构 walkthrough、来源证据和图示。
- `decision-matrix`：方案比较、推荐结论、取舍、风险和待确认问题。
- `conclusion-dashboard`：任务完成状态、release readiness、验证结果和摘要看板。

## 视觉和交互规则

- 使用视觉块、表格、时间线、diagram、代码面板、chips、tabs、details、filters、copy buttons 和 jump links 提升审查效率。
- 保持 narrow viewport 可读；长路径、长命令和长代码必须换行或滚动，不得压破布局。
- 所有来自 trace、tool output、用户输入、模型输出、文件路径和代码片段的内容都必须 escape 或 sanitize。
- code、diff 和 path 默认 inert；除非明确生成 safe local reference，不要把 path-derived content 变成可执行内容。
- 交互控件必须有可见文本或可访问标签，并支持 `prefers-reduced-motion`。

## 验证

交付前至少完成：

- validator structure checks 通过；
- 报告非空，结论和证据可读；
- Markdown、Mermaid、code、diff 等使用到的 section 已预渲染，或 runtime mode 明确 pin 依赖并保留 fallback；
- filters、tabs、copy controls 等控件存在且可用；
- browser smoke 已运行，或降级原因为真实不可用并被记录。

更多模式、schema 和安全规则见 `references/html-report-patterns.md`。
