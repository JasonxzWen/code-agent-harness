# 行业参考映射

本文件把外部项目实践映射到本项目决策。成熟项目支持某项能力，不代表本项目当前 release 必须实现该能力。

调研刷新日期：2026-05-11。

## OpenAI Codex

公开文档描述了 `AGENTS.md`、项目级配置、rules、hooks、skills、MCP、subagents、sandbox 和 approval policy。

项目决策：

- 使用 `AGENTS.md` 保存紧凑、持久的 repo 规则。
- 使用 `.codex/config.toml` 保存安全默认值和开发侧约束。
- 使用 rules、hooks 和 skills 辅助开发工作流。
- Codex subagents 可以用于开发协作，但不是 v0.1 产品能力。
- v0.1 产品侧只保留 provider-neutral loop 和工具调用，不直接实现 Codex 的完整工作区模型。

## Anthropic Claude Code

Claude Code 使用 permission modes、rules、hooks、`CLAUDE.md` memory、自定义 subagents，以及按工具控制的权限边界。

项目决策：

- 产品权限显式保留为 `allow`、`ask`、`deny`。
- 命令和写操作必须被 gate；v0.1 不提供写操作。
- 可在开发流程中使用 focused subagent pattern。
- v0.1 产品不引入隐藏 memory。

## opencode

opencode 验证了 terminal-first 方向，并提供 primary agent、subagents 和 per-agent permissions。

项目决策：

- terminal-first TUI 是合适的一版入口。
- plan/build 分离和多 agent mode 有价值，但 v0.1 产品保持 single-agent loop。
- 权限模型先按工具默认值实现，后续再评估 per-agent 权限。

## OpenClaw

OpenClaw 的公开 README 强调个人 AI 助手定位、multi-agent routing、skills、first-class tools，以及主 session host 与 sandbox execution 的组合。

项目决策：

- 不把本项目做成个人 AI 助手或多通道路由平台。
- skills 和 multi-agent routing 是后续可研究方向，不进入 v0.1。
- v0.1 安全边界由只读工具、命令 allowlist、权限 gate 和 trace 组成，不宣称 sandbox runtime。

## Hermes Agent

Hermes Agent 是更完整的 long-running agent 平台，公开文档入口包含 tools、skills、memory、MCP、cron、architecture 和多 terminal backend。

项目决策：

- 不做 long-running background agent、cron、persistent memory 或 MCP integration。
- 保持一次性本地 run，先稳定 loop、tool protocol、permission 和 event trace。
- 后续如果引入 memory 或 MCP，需要先写 release spec 和安全接受标准。

## OpenHands

OpenHands SDK 强调 reasoning-action loop、tool orchestration、context management、events、security validation 和 sandbox providers。

项目决策：

- event log 和 action-observation flow 是 v0.1 核心。
- 安全校验必须发生在工具执行前。
- sandbox runtime 是后续 scope，不属于 v0.1。

## Aider

Aider 的 repo map 和 architect/editor mode 是成熟的代码编辑 agent 模式。

项目决策：

- repo map 延后到 v0.4。
- edit/patch workflow 延后到 v0.2。
- v0.1 不让模型拥有写入路径。
