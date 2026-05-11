# Testing Strategy

## Test pyramid

```txt
Unit tests
  -> config, schemas, policies, pure logic

Integration tests
  -> tools against fixture repo

Agent loop tests
  -> mock provider + real registry

Build checks
  -> CLI bundle generation

Smoke tests
  -> CLI/harness-level basic run

Live smoke tests
  -> optional provider API run, not CI
```

## v0.1 required tests

| Area            | Required tests                                              |
| --------------- | ----------------------------------------------------------- |
| Config          | defaults, invalid config, override order                    |
| Path policy     | inside root, outside root, symlink escape                   |
| Secret policy   | `.env`, private keys, `.npmrc` denied                       |
| File reading    | text read, truncation, binary denial                        |
| Listing         | ignored paths, stable order                                 |
| Search          | snippets, result limit, ignored paths                       |
| Command policy  | allowlist command, write command denied, shell token denied |
| Permission gate | request event, decision event, denied tool not executed     |
| Tool registry   | unknown tool, invalid input, extra input, valid execution   |
| Agent loop      | tool call -> result -> final                                |
| Event logger    | writes JSONL, redacts secrets                               |
| TUI smoke       | renders initial state                                       |
| Build           | CLI bundle builds successfully                              |

## CI

```bash
bun install --frozen-lockfile
bun run format:check
bun run lint
bun run typecheck
bun run build
bun run test
bun run smoke
```

Live provider tests are not part of CI.
