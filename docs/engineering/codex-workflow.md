# Codex Workflow Configuration

This repository includes Codex project-level enhancements to make AI-assisted development more consistent.

## Public repo mechanisms

| Mechanism        | Location                     | Purpose                                    |
| ---------------- | ---------------------------- | ------------------------------------------ |
| Project guidance | `AGENTS.md`                  | compact repo rules loaded by Codex         |
| Project config   | `.codex/config.toml`         | sandbox, approvals, hooks, subagent limits |
| Rules            | `.codex/rules/default.rules` | command-level allow/prompt/forbid policy   |
| Hooks            | `.codex/hooks/`              | narrow dangerous-operation guardrails      |
| Custom agents    | `.codex/agents/`             | focused development helpers                |
| Skills           | `.agents/skills/`            | repeatable workflows                       |

## Scope distinction

Codex subagents and skills are development workflow infrastructure. They are not product-level features for v0.1.

The product itself stays single-agent and read-only in v0.1.

## Hook scope

Hooks are intentionally narrow. They block high-confidence dangerous operations,
such as destructive git commands and writes to protected secret or repository
metadata paths.

Process reminders belong in `AGENTS.md` and engineering docs. Quality gates
belong in skills, explicit commands, and CI rather than final-answer hooks that
infer completion quality from assistant message text.

## Private config

Personal model preferences, learning workflow, and operator intent belong in user-level Codex files, not public repository files.
