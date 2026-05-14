# 工程标准

## TypeScript

使用 strict TypeScript。

必需的编译器姿态：

```json
{
  "strict": true,
  "noUncheckedIndexedAccess": true,
  "exactOptionalPropertyTypes": true,
  "noImplicitOverride": true,
  "noFallthroughCasesInSwitch": true,
  "useUnknownInCatchVariables": true
}
```

## Package 边界

| Package              | 职责                                       | 不得执行                     |
| -------------------- | ------------------------------------------ | ---------------------------- |
| `apps/cli`           | TUI 和用户交互                             | 直接执行 tools               |
| `packages/core`      | 编排、状态、配置、权限、日志               | 引入 provider SDK 类型或 Ink |
| `packages/tools`     | tools 和安全策略                           | 调用 model providers         |
| `packages/providers` | provider adapters 和归一化 model interface | 执行 tools                   |

## 命名

| 对象      | 约定                  | 示例                   |
| --------- | --------------------- | ---------------------- |
| file      | kebab-case            | `agent-loop.ts`        |
| component | PascalCase            | `PermissionPrompt.tsx` |
| type      | PascalCase            | `AgentRunState`        |
| function  | camelCase             | `executeToolCall`      |
| schema    | PascalCase + `Schema` | `ToolCallSchema`       |
| event     | dot notation          | `tool.completed`       |
| tool      | snake_case            | `read_file`            |

## 错误

运行时错误应映射到：

```ts
export type AgentErrorKind =
  | "config_error"
  | "provider_error"
  | "tool_validation_error"
  | "tool_execution_error"
  | "permission_denied"
  | "path_policy_violation"
  | "secret_policy_violation"
  | "command_policy_violation"
  | "timeout"
  | "internal_error";
```

## 日志

- core packages 中不得随意写 stdout 日志。
- core 发出 events。
- CLI 负责渲染状态。
- Tool results 必须结构化。
- Secrets 必须被 redacted。

## 源码注释和编码

- 源码文件必须使用 UTF-8 编码。
- 核心逻辑需要适当的中文注释，注释说明 what、why、how：这段逻辑做什么、为什么需要这样设计、如何保护边界或连接上下游。
- 注释应帮助新手理解 agent loop、permission gate、tool registry、policy checks、provider normalization、trace redaction、CLI permission flow 和 smoke/E2E path。
- 不要逐行解释显而易见的赋值或语法；优先在复杂分支、跨 package boundary、安全策略、重试/abort、预检/执行双阶段等位置写短注释。
- 代码标识符、命令、路径、event name、tool name、error kind 和 API 名称在注释中也保留原文。

## Review handoff reports 规范

agent 在代码或文档变更后暂停给人工 review 时，报告必须围绕可 review 的变更点组织，而不是给一个平铺的文件列表。

每次 review handoff 必须包含：

- what changed；
- why it changed；
- how the implementation works；
- primary implementation 或 evidence 的精确 file 和 line number；
- 为什么该位置值得 review；
- 相关 test 或 documentation evidence，若适用。

默认使用 Feynman-style 解释：先用普通语言说明变更，再连接到具体代码路径和测试。reviewer 不需要把整个 diff 都放在脑中，也应能理解改了什么、为什么这样设计、如何验证。

优先使用短 bullets 或如下表格：

| What changed             | Why                               | How                             | File:line                              | Review focus                                 |
| ------------------------ | --------------------------------- | ------------------------------- | -------------------------------------- | -------------------------------------------- |
| Added patch policy check | 防止 traversal 被 normalized away | apply 前拒绝 `..` path segments | `packages/tools/src/patch-tool.ts:446` | 确认 policy boundary 匹配 release contract。 |

不要把裸的 "files changed" 列表作为主要 review handoff。

## 开发完成 HTML 变更汇报规范

当完成 release work、Ralph loop、跨多文件实现、用户明确要求 HTML 汇报，或变更需要人工长时间 review 时，agent 必须额外产出 self-contained HTML 变更汇报。它用于本地审查，不替代 chat final report、release note、PR description 或机器可读 eval report。

仓库已提供 `html-work-reports` skill 作为默认生成路径。优先用结构化 JSON 输入驱动 `.agents/skills/html-work-reports/scripts/create-report.mjs`，再用 `.agents/skills/html-work-reports/scripts/validate-html-report.mjs` 校验。手写 HTML 只作为特殊视觉例外，且仍需保留同等校验和降级说明。

强制触发场景：

- 用户明确要求 HTML 汇报、HTML report、工作报告、review report、技术汇报、面试讲解页、architecture walkthrough、status dashboard 或轻量导出页；
- release work、Ralph loop、跨多文件实现、跨模块重构、agent workflow 更新、skill 更新、规范/流程更新完成后需要交接；
- 用户要求说明“review 哪些核心逻辑”“面试被问到怎么讲”“当前改动在系统中的位置”“代码 walkthrough”；
- 交付需要直接查看代码片段、diff、trace、report、E2E/benchmark evidence、Mermaid 架构图或长表格。

建议触发场景：

- 调研、spec、alignment brief、release contract、readiness gap list 或 implementation stories 需要可视化审查；
- Markdown 回复会包含长 Mermaid、长代码、长表格、多段 evidence 或复杂取舍矩阵；
- 需要保留 source fallback，方便 reviewer 在浏览器中复核结论来源。

默认路径：

```txt
.agent-harness/reports/latest/change-report.html
```

如需保留多个历史版本，可使用：

```txt
.agent-harness/reports/<YYYYMMDD-HHMM>-<short-slug>/change-report.html
```

HTML 变更汇报必须包含：

- 本次目标和 scope；
- what / why / how 变更点；
- review focus 表格，含 repo-relative `file:line`；
- 需要 reviewer 直接审查的决定性代码片段或 diff，不能只给文件路径或摘要；
- 当前改动在系统中的位置、模块关系或关键数据流；涉及多模块或跨边界逻辑时必须使用已渲染 Mermaid 图表达；
- 已运行命令和真实结果；
- E2E、benchmark 或 browser evidence，若适用；
- 已知限制、未运行项和下一步；
- git branch 和 worktree 状态摘要。

约束：

- 报告必须是自包含静态 HTML，默认不依赖外部 CSS、JS、image 或 hosted service。
- 报告正文默认中文；代码标识符、命令、路径、API、外部项目名和引用标题保留原文。
- 报告优先从结构化输入渲染；HTML 不重新计算 pass/fail，不隐藏 JSON、Markdown、chat final report 或质量门禁中的失败项。
- 代码证据必须包含 repo-relative `file:line`、决定性片段或 diff、review focus 和验证含义。
- 代码证据必须直接出现在 HTML 中，并使用 code/diff section 的静态高亮和关键行标注；面向 review 的报告不得只用路径表替代代码证据。
- Mermaid、Markdown、code 和 diff 默认预渲染；Mermaid 必须渲染为 inline SVG 或在报告中明确记录降级原因，runtime mode 必须 pin 依赖并保留 source fallback。
- 如果本仓库 `html-work-reports` skill 缺少 Mermaid 渲染、代码高亮或 source fallback 能力，先对照或拉取 `D:\skill-hub` 的 `html-work-reports` 组件，再交付报告。
- 报告内容不得声称未运行的 E2E、benchmark、browser smoke 或 quality gate 已通过。
- 报告默认使用 repo-relative path；不得写入 secret、token-looking value、用户主目录或与审查无关的本机私有路径。
- 如果 HTML 汇报本身包含交互控件或复杂布局，必须做 browser smoke 或记录未运行、降级或不可用原因。
- final response 必须给出该 HTML 报告路径，并继续保留简短 Review focus 和质量门禁摘要，方便不打开浏览器的 reviewer 快速判断。

## Runtime contract 契约s

- 将 model-generated tool input 视为不可信外部输入。
- 运行时拒绝 unknown tool input fields。
- 在 path policy、command policy、permission 或 execution 之前完成 validate。
- 安全必须在代码中执行，不得只依赖 prompt。
- Permission approval 不能覆盖 deterministic deny rules。
- v0.1 tools 必须保持 read-only。

## Build contract 契约

- `bun run build` 必须在 `dist/agent-harness.js` 产出本地 CLI bundle。
- build 可以 externalize runtime dependencies，但必须 bundle 本地 CLI source，并且在 `bun install` 后可用 `bun dist/agent-harness.js ...` 运行。
- 任何 CLI entrypoints、workspace package exports、runtime dependency loading 或 TypeScript module resolution 的变更，都必须保持 `bun run build` 通过。
- `bun run quality` 和 CI 必须包含 `bun run build`，以便 release 前发现 build drift。

## 文档语言

- 仓库协作、agent updates、final report 和新增文档默认使用中文。
- 详细语言政策见 `docs/engineering/language-policy.md`。
- 代码标识符、命令、路径、包名、API 名称、event name、tool name、外部项目名和引用标题保留原文。
- Markdown 表格、Mermaid、命令块、链接和 frontmatter 不得因中文化被破坏。
- 未运行的 E2E、benchmark 或质量门禁必须标为未运行，不得写成通过。

## Release documentation 规范

- 每份 release note 必须遵守 `docs/engineering/release-documentation-standard.md`。
- Release notes 必须解释 features、key logic、code definition locations、implementation rationale、industry comparison、quality evidence、known limitations 和 next steps。
- Release notes 必须包含至少一个 Mermaid diagram，用于展示 release flow、capability boundary 或 module change。
- 从 `v0.2.0` 开始，新增 release notes、release contracts、checklists、specs、research notes 和 ADRs 必须使用中文正文。代码标识符、命令、包名、外部项目名和 source titles 可以保留原文。

## Commits

使用 Conventional Commits：

```txt
feat(core): add agent loop
feat(tools): add read_file tool
fix(tools): block symlink escape
docs(adr): add read-only v0.1 decision
test(core): cover permission denied flow
ci: add quality gate
```
