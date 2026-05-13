# Code Agent Harness

面向真实仓库的 release-driven TypeScript coding agent harness。

`code-agent-harness` 是一个 terminal-first 开发者工具，用明确的运行时契约来构建和演进 coding agent：agent loop、tool calling、安全仓库检查、权限、上下文管理、trace logging 和 evaluation readiness。

## 它是什么

- 本地 coding agent harness；
- terminal-first 开发者工具；
- TypeScript agent runtime；
- 带 schema 校验的 tool-calling 系统；
- permission-aware 仓库检查工作流；
- release-driven 工程项目。

## 它不是什么

- 不是 chatbot wrapper；
- 不是 demo website；
- 不是 general assistant；
- 不是 Devin clone；
- 不是 auto-commit 或 auto-PR bot；
- 当前写入能力只限 `v0.2.0` 的受控 `apply_patch` workflow。

## 当前 release

当前已交付基线：`v0.2.0 Patch-capable Agent`

```txt
用户任务
-> Agent Loop
-> Tool Calling
-> Safe Repo Read
-> Patch Preview
-> Explicit Approval
-> Apply Patch
-> Grounded Final Response
-> JSONL Trace
```

`v0.2.0` 新增一个受控写入工具：

```txt
apply_patch: ask
```

`apply_patch` 会预检 unified diff、拒绝 deterministic policy failures、在批准前展示 preview、写入前再次校验，并且只写工作区。它不会 stage、commit、push，不会新增 sandbox，也不会放宽 `run_command`。

## 正在规划

当前文档迁移目标：`v0.2.1 Chinese-first Repository Migration`

`v0.2.1` 只迁移仓库文档和流程契约，目标是让 release docs、research、spec、ADR、engineering standards、checklists、agent docs、templates、skills、README、CHANGELOG 和 `AGENTS.md` 默认使用中文正文。当前全仓 Markdown 文档已完成中文优先迁移；代码标识符、命令、路径、包名、API 名称、外部项目名和引用标题保留原文。

当前实现目标：`v0.3.0 Evaluation Harness`

`v0.3.0` 新增本地 deterministic eval 入口，用固定任务、JSONL trace、确定性检查和本地 JSON / Markdown / HTML reports 度量既有行为是否回归。

发布说明：`docs/releases/v0.3.0.md`

## 快速开始

```bash
bun install
bun run build
bun run dev -- --repo fixtures/tiny-ts-repo --task "Explain this repository structure and identify the main modules."
```

TUI 运行中可按 `q` 或 `Ctrl+C` 中止 run。

构建命令会生成 `dist/agent-harness.js`。构建后可直接运行 CLI bundle：

```bash
bun dist/agent-harness.js --repo fixtures/tiny-ts-repo --task "Explain this repository structure and identify the main modules."
```

示例任务：

```txt
Explain this repository structure and identify the main modules.
```

运行 v0.3 本地评估并生成 HTML 汇报：

```bash
bun run eval -- --suite v0.3 --out .agent-harness/evals/latest
```

输出文件：

```txt
.agent-harness/evals/latest/report.json
.agent-harness/evals/latest/report.md
.agent-harness/evals/latest/report.html
```

HTML 汇报内容包含 eval 结果和从 `CHANGELOG.md` 解析出的 release log 数据，可直接查看 release timeline、section 和条目。

报告隐私规范：eval reports 只能显示 repo-relative path 或 `[external-output]/...`，严禁输出本机绝对路径、用户主目录、系统用户名或 token-looking secret。

## 架构

```txt
apps/cli
  -> Ink TUI
      -> packages/core
          -> Agent Controller
          -> Provider Client
          -> Tool Registry
          -> Permission Gate
          -> JSONL Event Logger
```

## 安全模型

v0.1 默认值：

```txt
read tools: allow
restricted commands: ask
write operations: unavailable
```

v0.2 默认值：

```txt
read tools: allow
restricted commands: ask
apply_patch: ask
```

## 开发

```bash
bun install
bun run format
bun run format:check
bun run lint
bun run typecheck
bun run build
bun run eval -- --suite v0.3 --out .agent-harness/evals/latest
bun run test
bun run smoke
bun run quality
```

## 工作区

```txt
apps/cli              Ink TUI and user interaction
packages/core         agent loop, config, events, and public runtime contracts
packages/tools        read tools, apply_patch, validation, and safety policy
packages/providers    provider adapters and normalized provider boundary
fixtures/tiny-ts-repo deterministic smoke-test repository
scripts               smoke, live smoke, and eval entrypoints
```

## 当前限制

`v0.2.0` patch support 故意保持窄范围。它不做：

- auto-stage、auto-commit、auto-push 或创建 PR；
- 应用 binary、mode、symlink、rename 或 copy patches；
- 修改 secret-looking paths；
- 自动解决 merge conflicts；
- persistent memory；
- product-level subagents；
- MCP integration；
- sandbox isolation。

Live OpenAI runs 仍继承 `docs/agent/openai-provider.md` 记录的 provider 限制：tool results 作为普通 `user` messages 回传，而不是 provider-native `tool_call_id` messages。

## 路线图

见 `docs/roadmap.md`。
