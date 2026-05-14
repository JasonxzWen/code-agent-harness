---
name: html-work-reports
description: 当用户要求 HTML 汇报/报告/可视化交接，或已完成的非平凡任务需要代码 review handoff、release/Ralph 汇报、面试 walkthrough、调研解释、架构/数据流图、状态看板或轻量导出页时使用；不要用于权限暂停、简单聊天回答、生产 UI、slide deck 或打包 web app。
---

# HTML 工作汇报

## 目标

把已经完成或已经形成结论的工作沉淀为一个可本地打开、可审查、可携带的 `.html`。它服务于审查和交接，不替代 chat final report、release note、PR description、JSON report 或真实质量门禁。

## 何时使用

强制使用本 skill：

- 用户明确要求 HTML 汇报、HTML report、工作报告、review report、status dashboard、research explainer、architecture walkthrough、面试讲解页或轻量导出页。
- 完成 release work、Ralph loop、跨多文件实现、跨模块重构、agent workflow 更新、skill 更新、规范/流程更新，且需要给人审查或复盘。
- 用户要求“我应该 review 哪些核心逻辑”“面试被问到怎么讲”“把系统位置画出来”“代码 walkthrough”“技术汇报”“alignment brief 用 HTML 汇报”等审查或讲解型交付。
- 交付内容需要 reviewer 直接看代码、diff、trace、report、benchmark evidence、E2E evidence、Mermaid 架构图或长表格。

建议使用本 skill：

- 非平凡任务已经形成稳定结论，结论包含变更点、取舍、代码证据、质量门禁、E2E/benchmark evidence、风险或下一步。
- Markdown 回复会变成长表格、长 Mermaid、长代码片段、多段 code review evidence 或难以扫描的审查材料。
- 需要把调研、spec、release contract、readiness gap list、implementation stories 或 release readiness 做成可浏览材料。
- 需要对比多个方案、多个文件、多个 evidence source，或需要保留 source fallback 方便复查。

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
- 对代码或文档变更，必须包含 repo-relative `file:line`、决定性片段或 diff、review focus 和验证证据；需要 reviewer 重点看的逻辑不能只给路径或摘要，必须把相应片段直接贴进 HTML，并使用 code/diff section 的静态高亮和关键行标注。
- 对系统位置、复杂路径、架构、流程或数据流，优先渲染 Mermaid 为 inline SVG，同时保留可审查的 source fallback；如果 Mermaid 只能降级为 fallback，报告和 final response 都必须明确说明降级原因。
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
5. 只有在模板无法表达任务时才手写 HTML；手写时仍复用 `assets/components/` 的静态组件，并运行 validator。手写报告不得跳过本 skill 已支持的 code highlighting、diff highlighting、Mermaid rendering、source fallback 和 browser validation；如果本仓库 skill 缺少对应组件，先从 `D:\skill-hub` 对照或拉取 `html-work-reports` 组件后再交付。

## 模板选择

直接使用 `assets/templates/` 手写报告时，必须先替换占位文本，并把用户可见正文本地化为中文。优先使用生成器，因为生成器会按结构化输入输出本仓库约定的中文审查视图。

- `implementation-handoff`：实现完成交接、变更点、文件证据、验证、风险和下一步。
- `review-findings`：代码审查、PR 审查、风险分级、owner 和行动项导出。
- `research-explainer`：调研综合、架构 walkthrough、来源证据和图示。
- `decision-matrix`：方案比较、推荐结论、取舍、风险和待确认问题。
- `conclusion-dashboard`：任务完成状态、release readiness、验证结果和摘要看板。

## 视觉和交互规则

- 使用视觉块、表格、时间线、diagram、代码面板、chips、tabs、details、filters、copy buttons 和 jump links 提升审查效率；面向代码 review 的报告必须包含可复制的高亮代码面板，而不是只列文件路径。
- 代码面板必须有可见 token color highlighting，不得只有 `hljs-*` class 而无颜色；默认行距使用紧凑阅读密度，避免长片段被过大行距拉长。
- 保持 narrow viewport 可读；长路径、长命令和长代码必须换行或滚动，不得压破布局。
- 所有来自 trace、tool output、用户输入、模型输出、文件路径和代码片段的内容都必须 escape 或 sanitize。
- code、diff 和 path 默认 inert；除非明确生成 safe local reference，不要把 path-derived content 变成可执行内容。
- 交互控件必须有可见文本或可访问标签，并支持 `prefers-reduced-motion`。

## 验证

交付前至少完成：

- validator structure checks 通过；
- 报告非空，结论和证据可读；
- Markdown、Mermaid、code、diff 等使用到的 section 已预渲染，或 runtime mode 明确 pin 依赖并保留 fallback；
- 需要说明系统位置、模块关系或数据流时，Mermaid section 已生成 inline SVG 或清楚记录降级原因；
- 每个 review focus 中需要人工确认的核心逻辑都有直接代码片段或 diff，并启用静态高亮和关键行标注；
- code section 的 token color styles 和紧凑 line-height 已被内联到 HTML，并通过 validator 检查；
- filters、tabs、copy controls 等控件存在且可用；
- browser smoke 已运行，或降级原因为真实不可用并被记录。

更多模式、schema 和安全规则见 `references/html-report-patterns.md`。
