# TypeScript Coding Agent Runtime Research Harness

`code-agent-harness` 是一个用 **learning-by-building** 方式研究现代 coding agent runtime 的 TypeScript harness。

它 focused on understanding Claude Code / Codex-like runtime mechanisms：通过亲手实现 scoped instructions、memory、subagents、orchestration、skills、hooks、permissions、trace 和 eval 等机制，理解这类工具的 public behavior、设计取舍和可验证边界。

它面向真实仓库和 terminal-first workflow，但定位是研究型工程项目，不是要复制任何一个商业产品的内部实现。

## 它是什么

- TypeScript Coding Agent Runtime Research Harness；
- learning-by-building 的研究项目；
- 面向真实仓库的 terminal-first coding agent runtime 实验场；
- 用确定性测试、trace 和 eval reports 观察 agent 行为；
- 用 release-driven 方式逐步研究现代 coding agent 的公开行为和设计推断。

## 它不是什么

- 不是 Claude Code clone；
- 不是 Codex clone；
- 不是 Devin clone；
- 不是 production IDE agent；
- 不是 benchmark suite；
- 不是 demo website；
- 不是 auto-commit 或 auto-PR bot。

## 当前已实现能力

| Release    | 已实现范围                                              | 说明                                                                                                                               |
| ---------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| v0.1       | Minimal Agent Loop / read tools / trace                 | 支持最小 agent loop、安全仓库读取工具、tool validation、permission gate 和 JSONL event trace。                                     |
| v0.2       | controlled `apply_patch` / permission preview           | 新增受控写入工具，默认 `ask`，写入前展示 diff preview 并要求显式批准；不会自动 stage、commit 或 push。                             |
| v0.3       | deterministic eval harness / JSON Markdown HTML reports | 新增本地 deterministic eval 入口，运行 fixed task matrix，解析 JSONL trace，并输出 JSON / Markdown / self-contained HTML reports。 |
| Unreleased | `html-work-reports` skill and handoff rules             | 新增本地 HTML handoff report 生成和校验规则，用于实现、review 和 release 交接，不新增 runtime 能力。                               |

当前还没有实现 persistent memory、product-level subagents、team orchestration、skills runtime、hooks runtime、MCP integration 或 sandbox isolation。

## Research Focus

- scoped instructions and memory；
- subagents and context isolation；
- orchestration with task lists and mailboxes；
- skills and progressive disclosure；
- lifecycle hooks；
- permission modes and sandbox-lite；
- trace and eval。

## Current Mismatch Fixed In v0.3.1

`v0.3.1 Research Harness Alignment` 只修正项目定位、路线图、研究文档入口和 release 叙述。

本版本同步以下事实：

- `package.json` 当前版本仍是 `0.3.0`；
- 当前已发布基线是 `v0.3.0 Evaluation Harness`；
- README、roadmap、AGENTS 和项目章程不应继续把 `v0.2.0` 写成当前基线，或把 `v0.3.0` 写成当前实现目标；
- 后续路线从“泛化产品化能力”调整为“通过构建 runtime 机制来研究 Claude Code / Codex-like public behavior”。

`v0.3.1` 不修改 runtime 代码，不新增 memory、subagents、orchestration、skills runtime、hooks runtime 或 permission modes。

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
docs                  research, specs, release docs, roadmap, engineering notes
.agents/skills        repeatable Codex workflows and handoff helpers
```

## 当前限制

当前 runtime 故意保持窄范围。它不做：

- auto-stage、auto-commit、auto-push 或创建 PR；
- 应用 binary、mode、symlink、rename 或 copy patches；
- 修改 secret-looking paths；
- 自动解决 merge conflicts；
- persistent memory；
- product-level subagents；
- multi-agent orchestration；
- skills runtime；
- lifecycle hooks runtime；
- MCP integration；
- sandbox isolation。

Live OpenAI runs 仍继承 `docs/agent/openai-provider.md` 记录的 provider 限制：tool results 作为普通 `user` messages 回传，而不是 provider-native `tool_call_id` messages。

## 路线图

见 `docs/roadmap.md`。
