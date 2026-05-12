# Codex Workflow 配置

本仓库包含 Codex project-level enhancements，用于让 AI-assisted development 更一致。

## 公共仓库机制

| Mechanism        | Location                     | Purpose                                       |
| ---------------- | ---------------------------- | --------------------------------------------- |
| Project guidance | `AGENTS.md`                  | Codex 加载的 compact repo rules               |
| Project config   | `.codex/config.toml`         | sandbox、approvals、hooks、subagent 限制      |
| Rules            | `.codex/rules/default.rules` | command-level allow/prompt/forbid policy 规则 |
| Hooks            | `.codex/hooks/`              | 窄范围 dangerous-operation guardrails         |
| Custom agents    | `.codex/agents/`             | 聚焦的 development helpers                    |
| Skills           | `.agents/skills/`            | repeatable workflows                          |

## 范围 区分

Codex subagents 和 skills 是 development workflow infrastructure。它们不是 v0.1 的 product-level features。

v0.1 产品本身保持 single-agent 和 read-only。

## Hook scope 范围

Hooks 故意保持窄范围。它们阻止 high-confidence dangerous operations，例如 destructive git commands，以及对 protected secret 或 repository metadata paths 的写入。

Process reminders 属于 `AGENTS.md` 和 engineering docs。Quality gates 属于 skills、explicit commands 和 CI，而不是依赖 final-answer hooks 从 assistant message text 推断完成质量。

## 私有配置

Personal model preferences、learning workflow 和 operator intent 应放在 user-level Codex files 中，而不是 public repository files。
