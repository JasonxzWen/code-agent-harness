# Codex Hooks

These hooks are optional project guardrails for Codex.

Keep hooks narrow. They should block only high-confidence dangerous operations,
not manage development workflow, quality reporting, or process reminders.

They are enabled by `.codex/config.toml`:

```toml
[features]
codex_hooks = true
```

## Hooks

| Hook                           | Event        | Purpose                                                  |
| ------------------------------ | ------------ | -------------------------------------------------------- |
| `dangerous_operation_guard.py` | `PreToolUse` | block destructive commands and writes to protected paths |

Hooks are guardrails, not the only enforcement mechanism. Command approval rules,
project guidance, skills, tests, lint, typecheck, CI, and product-level
permissions remain required.

Quality gates and final-report expectations belong in `AGENTS.md`, skills, and
CI. They should not be enforced by a final-answer hook that only inspects
assistant message text.

## Windows runner

`hooks.json` invokes hooks through `run_hook.ps1` so the project works in Windows/PowerShell environments without `/usr/bin/python3`.

Python resolution order:

1. `CODEX_HOOK_PYTHON`
2. `PYTHON`
3. `python`
4. `py -3`
5. `python3`
