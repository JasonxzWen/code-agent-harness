# Comparable Projects and Maturity Signals

This document tracks mature patterns from comparable coding-agent systems. It is not a feature wishlist. Each signal must map to a release decision.

## Summary

| Project      | Mature pattern                                                                             | Project decision                                                              |
| ------------ | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| OpenAI Codex | AGENTS.md, config, rules, hooks, skills, subagents, sandbox/approval controls              | Use Codex-native repo guidance and workflow automation around development     |
| Claude Code  | CLAUDE.md, permission modes, hooks, custom subagents, plan mode                            | Mirror safety pattern: read allowed, command/edit approval, focused subagents |
| OpenCode     | terminal-first UI, primary agents, subagents, per-agent permissions                        | TUI-first direction validated; permissioned agent modes are useful            |
| OpenHands    | event-driven reasoning-action loop, tool execution, security validation, sandbox providers | Keep event log and safety validation central                                  |
| Aider        | repo map and architect/editor mode                                                         | Defer repo map to v0.4 and patch design to v0.2                               |

## Design implications

1. Public project docs should present product architecture and engineering choices, not private motivation.
2. Development workflows can use Codex subagents/skills without making subagents part of v0.1 product scope.
3. Safety should be enforced through deterministic rules, permissions, hooks, tests, and code policy.
4. Context engineering should start simple, then evolve toward repo maps or deterministic repo intelligence only when eval shows need.
5. Agent behavior must be observable through event traces from v0.1.

## Sources

- OpenAI Codex customization: https://developers.openai.com/codex/concepts/customization
- OpenAI Codex AGENTS.md: https://developers.openai.com/codex/guides/agents-md
- OpenAI Codex rules: https://developers.openai.com/codex/rules
- OpenAI Codex hooks: https://developers.openai.com/codex/hooks
- OpenAI Codex skills: https://developers.openai.com/codex/skills
- OpenAI Codex subagents: https://developers.openai.com/codex/subagents
- Claude Code permissions: https://code.claude.com/docs/en/permissions
- Claude Code subagents: https://code.claude.com/docs/en/sub-agents
- Claude Code hooks: https://code.claude.com/docs/en/hooks
- OpenCode agents: https://opencode.ai/docs/agents/
- OpenCode permissions: https://opencode.ai/docs/permissions/
- OpenHands agent architecture: https://docs.openhands.dev/sdk/arch/agent
- OpenHands sandboxes: https://docs.openhands.dev/openhands/usage/sandboxes/overview
- Aider repo map: https://aider.chat/docs/repomap.html
- Aider modes: https://aider.chat/docs/usage/modes.html
