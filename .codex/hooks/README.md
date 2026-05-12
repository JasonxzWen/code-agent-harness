# Codex Hooks

这些 hooks 是 Codex 的 optional project guardrails。

保持 hooks 窄范围。它们只应阻止 high-confidence dangerous operations，不应管理 development workflow、quality reporting 或 process reminders。

它们由 `.codex/config.toml` 启用：

```toml
[features]
codex_hooks = true
```

## Hooks

| Hook                           | Event        | Purpose                            |
| ------------------------------ | ------------ | ---------------------------------- |
| `dangerous_operation_guard.py` | `PreToolUse` | 阻止破坏性命令和对受保护路径的写入 |

Hooks 是 guardrails，不是唯一 enforcement mechanism。Command approval rules、project guidance、skills、tests、lint、typecheck、CI 和 product-level permissions 仍然必需。

Quality gates 和 final-report expectations 属于 `AGENTS.md`、skills 和 CI。不应通过只检查 assistant message text 的 final-answer hook 强制执行。

## Windows runner

`hooks.json` 通过 `run_hook.ps1` 调用 hooks，因此项目可在 Windows/PowerShell 环境中工作，不依赖 `/usr/bin/python3`。

Python resolution order：

1. `CODEX_HOOK_PYTHON`
2. `PYTHON`
3. `python`
4. `py -3`
5. `python3`
