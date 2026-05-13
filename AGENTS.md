# AGENTS.md

面向在 `code-agent-harness` 仓库工作的 AI coding agents 的项目指引。

保持本文件简洁。详细流程文档在 `docs/engineering/`，任务专用工作流在 `.agents/skills/`。

## 语言政策

始终用中文回复。自 `v0.2.1` 起，仓库文档、规范、release contract、research、spec、checklist、ADR、README、CHANGELOG、AGENTS.md 和 skills 文档默认使用中文正文。代码标识符、命令、路径、包名、API 名称、外部项目名和引用标题保留原文。详细规则见 `docs/engineering/language-policy.md`。

## 项目

`code-agent-harness` 是面向真实仓库的 release-driven TypeScript coding agent harness。

它聚焦：

- agent loop runtime；
- tool calling 和 tool validation；
- repository inspection；
- permission 和 safety policy；
- context management；
- event traces；
- evaluation readiness；
- terminal-first 开发者体验。

## 当前 release

当前已交付基线：`v0.2.0 Patch-capable Agent`。

当前迁移目标：`v0.2.1 Chinese-first Repository Migration`。

`v0.2.1` 是文档和流程 release，不改变产品运行时代码。

## 非目标

当前迁移不要实现：

- UI、provider、patch tool、MCP、sandbox、subagents、IDE extension；
- 产品功能代码变更；
- 自动翻译流水线；
- 多语言站点；
- 自动 tag、publish、commit、push 或 PR。

## 技术栈

- TypeScript
- Bun / Node-compatible runtime
- Ink + React for TUI
- Zod for schemas
- OpenAI provider first
- v0.1 只保留 Anthropic provider boundary
- 在 policy 后使用 execa 执行 subprocess
- 需要 read-only git operations 时可使用 simple-git

## 仓库布局

```txt
apps/cli              Ink TUI and user interaction
packages/core         agent loop, state, config, permission, logging
packages/tools        tool definitions and safe execution
packages/providers    provider adapters and normalized model interface
docs                  architecture, specs, ADRs, releases, research
fixtures              deterministic test repositories
scripts               smoke and developer scripts
.codex                Codex project config, rules, hooks, custom agents
.agents/skills        Codex skills for repeatable workflows
```

## 工程规则

- Preserve package boundaries。
- Use strict TypeScript。
- 使用 Zod 校验 external/model-generated input。
- 不要让 provider-specific SDK shapes 进入 `packages/core`。
- 不要让 TUI business logic 进入 `packages/core`。
- command execution 只能位于 approved command tool 或 scripts 中。
- 不要依赖 prompt-only safety；必须在代码中 enforce safety。
- 为 success 和 failure paths 添加 tests。
- public behavior 改变时更新 docs。
- 新增或重写文档正文默认中文，技术标识保留原文。
- 核心源码注释默认使用中文和 UTF-8，解释 what、why、how，帮助新手理解核心逻辑。

## 开发流程

初始 agent loop scaffold 之后的功能工作遵循：

```txt
research -> spec -> alignment brief -> implementation -> quality gates -> self-review -> final report
```

对 v0.1 blockers，不要在相关 `docs/specs/v0.1/` spec 存在且 acceptance criteria 明确前开始实现。

## Release 文档

每个 release 都必须有用户可读文档，并说明：

- 每个 feature 是什么、用户需求、主场景、同类产品行为、本项目方案、为什么适合、如何实现、E2E acceptance、benchmark evidence 和 limitations；
- 关键逻辑和代码定义位置；
- 展示 release flow 或 change boundary 的 Mermaid 图；
- 为什么选择当前实现；
- Claude Code、Codex、opencode、OpenClaw、Hermes Agent 等同类项目如何处理同类问题；
- 本项目为什么选择当前 release-scoped approach。

release 实现开始前，至少刷新 Codex、Claude Code、opencode 以及 release-relevant peers 的 comparable-project research。research 必须映射到本 release scope，不能因为模仿外部项目而扩大范围。

用户可见 release feature 不能只靠 unit tests 发布。必须补充从 user-level entrypoint 到 final answer、artifact、trace 或 worktree evidence 的 E2E acceptance evidence。每个 release feature 还必须定义 benchmark questions、metrics、fixtures、commands 或 artifacts、thresholds、results、peer baselines 和 caveats。

从 `v0.2.0` 起，新增 release-facing docs 必须使用中文正文。自 `v0.2.1` 起，中文优先规则扩展到 README、CHANGELOG、AGENTS.md、engineering docs、agent docs、templates 和 skills 文档。

## 质量门禁

实现工作结束前运行：

```bash
bun run format:check
bun run lint
bun run typecheck
bun run build
bun run test
bun run smoke
bun run quality
```

不要声称未运行的命令通过。

## 代码变更最终汇报格式

完成 release work、Ralph loop、跨多文件实现，或用户明确要求 HTML 汇报时，必须额外产出 self-contained HTML 变更汇报。默认路径：

```txt
.agent-harness/reports/latest/change-report.html
```

该 HTML report 是本地审查 artifact，不替代下面的 chat final report。最终回复必须给出 HTML report 路径，并继续提供简短 Review focus 和真实 quality gate 结果。

```md
## Completed

## Review focus

| What changed | Why | How | File:line | Review focus |
| ------------ | --- | --- | --------- | ------------ |

## Quality gates

| Command              | Result            |
| -------------------- | ----------------- |
| bun run format:check | pass/fail/not run |
| bun run lint         | pass/fail/not run |
| bun run typecheck    | pass/fail/not run |
| bun run build        | pass/fail/not run |
| bun run test         | pass/fail/not run |
| bun run smoke        | pass/fail/not run |

## Self-review

## Known limitations

## Next step
```

暂停给人审查时，不要把文件列表当作主要交接。必须围绕可审查的变更点说明 what changed、why、how，并给出精确 `file:line`，让 reviewer 不读完整 diff 也能理解变更和审查重点。
