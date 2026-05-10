# Industry Reference Map

Use this map to connect external practices to project decisions. Do not expand scope just because a mature tool supports a feature.

## OpenAI Codex

Official docs describe project guidance through `AGENTS.md`, project-scoped `.codex/config.toml`, rules, hooks, skills, MCP, and subagents.

Project decisions:

- Use `AGENTS.md` for compact durable repo rules.
- Use `.codex/config.toml` for safe project defaults and subagent limits.
- Use rules and hooks as Codex-side guardrails.
- Use repo skills for repeatable development workflows.
- Use Codex subagents for development assistance, not as v0.1 product scope.

## Anthropic Claude Code

Claude Code uses permission modes, rules, hooks, CLAUDE.md memory, and custom subagents with isolated context and specific tool access.

Project decisions:

- Keep product permissions explicit: allow/ask/deny.
- Keep command and write operations gated.
- Use focused subagent patterns in development workflow.
- Do not introduce hidden memory into v0.1 product.

## OpenCode

OpenCode validates the terminal-first direction and offers primary agents/subagents with permissions.

Project decisions:

- Terminal-first TUI is appropriate.
- Plan/build separation is useful, but v0.1 product stays single-agent.

## OpenHands

OpenHands SDK highlights a reasoning-action loop, tool orchestration, context management, events, and security validation.

Project decisions:

- Event logs and action-observation flow are central.
- Security validation belongs before tool execution.

## Aider

Aider's repo map and architect/editor mode are mature patterns for later releases.

Project decisions:

- Repo map is deferred to v0.4.
- Editing/patching is deferred to v0.2.
