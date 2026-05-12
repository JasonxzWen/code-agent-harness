# 可对照项目和成熟度信号

本文件记录主流 coding-agent 或 agent-platform 项目的成熟模式。它不是功能愿望清单；每个外部信号都必须映射到本项目的 release 决策。

调研刷新日期：2026-05-11。

## 总览

| 项目         | 成熟模式                                                                                      | 本项目决策                                                                        |
| ------------ | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| OpenAI Codex | `AGENTS.md`、项目配置、rules、hooks、skills、subagents、sandbox/approval controls。           | 使用 Codex-native repo guidance 优化开发流程；v0.1 产品不内置 subagents 或 MCP。  |
| Claude Code  | `CLAUDE.md` memory、permission modes、hooks、custom subagents、plan mode。                    | 借鉴显式权限模式：read 默认安全，命令和写入必须被 gate；v0.1 不做 hidden memory。 |
| opencode     | terminal-first UI、primary/subagents、per-agent permissions。                                 | terminal-first 方向成立；permissioned agent modes 后续再评估。                    |
| OpenClaw     | personal AI assistant、multi-agent routing、skills、first-class tools、session host/sandbox。 | 不做个人助理、多通道路由或内置 sandbox；聚焦真实仓库检查 harness。                |
| Hermes Agent | long-running agent platform、tools、skills、memory、MCP、cron、多 terminal backend。          | 不做 background、cron、memory 或 MCP；先稳定一次性本地 run。                      |
| OpenHands    | reasoning-action loop、tool execution、security validation、sandbox providers。               | 保持 action-observation trace 和安全校验为中心。                                  |
| Aider        | repo map、architect/editor mode。                                                             | repo map 延后到 v0.4，patch/edit 设计延后到 v0.2。                                |

## 设计推论

1. 公开文档应解释产品架构、release 取舍和用户可见限制，不写私有操作动机。
2. 开发流程可以使用 Codex subagents/skills，但不能把它们误写成 v0.1 产品能力。
3. 安全必须通过确定性 policy、权限 gate、测试和代码约束执行，不能只靠 prompt。
4. Context engineering 先保持工具驱动，只有在 eval 显示必要时再引入 repo map、索引或 ranking。
5. 从 v0.1 开始保留事件 trace，便于调试和后续评估。
6. OpenClaw 和 Hermes Agent 说明成熟平台会把 skills、memory、sandbox、cron、MCP、多 agent 组合起来；本项目当前不追平台完整度，先追可验证 harness 内核。

## 来源

- OpenAI Codex customization: https://developers.openai.com/codex/concepts/customization
- OpenAI Codex AGENTS.md: https://developers.openai.com/codex/guides/agents-md
- OpenAI Codex rules: https://developers.openai.com/codex/rules
- OpenAI Codex hooks: https://developers.openai.com/codex/hooks
- OpenAI Codex skills: https://developers.openai.com/codex/skills
- OpenAI Codex subagents: https://developers.openai.com/codex/subagents
- OpenAI Codex sandboxing: https://developers.openai.com/codex/concepts/sandboxing
- Claude Code permissions: https://code.claude.com/docs/en/permissions
- Claude Code subagents: https://code.claude.com/docs/en/sub-agents
- Claude Code hooks: https://code.claude.com/docs/en/hooks
- opencode agents: https://opencode.ai/docs/agents/
- opencode permissions: https://opencode.ai/docs/permissions/
- OpenClaw README: https://github.com/openclaw/openclaw
- Hermes Agent README: https://github.com/NousResearch/hermes-agent
- OpenHands agent architecture: https://docs.openhands.dev/sdk/arch/agent
- OpenHands sandboxes: https://docs.openhands.dev/openhands/usage/sandboxes/overview
- Aider repo map: https://aider.chat/docs/repomap.html
- Aider modes: https://aider.chat/docs/usage/modes.html
