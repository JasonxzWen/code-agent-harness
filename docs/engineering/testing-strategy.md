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

E2E acceptance
  -> user workflow from task input to final answer/artifact/trace

Live smoke tests
  -> optional provider API run, not CI

Benchmark tests
  -> quantified scenario matrix and release evidence
```

## E2E acceptance rule

User-visible release features cannot ship with unit tests alone. Each such
feature must have at least one E2E acceptance path that starts from a user-level
entrypoint and verifies the final observable evidence.

Acceptable E2E evidence includes:

- CLI or TUI workflow from task input to final answer;
- deterministic provider + real tool registry + fixture repository;
- generated trace or artifact proving the workflow boundary;
- documented manual step only when automation is not possible, with a clear
  reason and expected evidence.

If a user-visible feature has only unit tests, release readiness must mark that
as a blocker or document an explicit exception.

## Benchmark rule

Every release feature needs a benchmark question and measurable evidence. The
benchmark may compare against competitor practice when direct execution is not
available, but it must not imply an executed ranking unless the competitor was
actually run under documented conditions.

Benchmark evidence should record:

- scenario and fixture;
- metrics and thresholds;
- commands or artifacts;
- result and caveats;
- peer baseline from Codex, Claude Code, opencode, or a release-relevant peer.

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

## v0.2 patch required tests

| Area             | Required tests                                                           |
| ---------------- | ------------------------------------------------------------------------ |
| Core contract    | `PermissionRequest.preview`; bounded preview trace; result metadata      |
| Permission gate  | denied permission does not execute; policy-denied preflight does not ask |
| Patch validation | invalid patch syntax and extra input fields                              |
| Path policy      | path traversal and symlink escape denied                                 |
| Secret policy    | `.env`, `.pem`, `.key`, and private key-looking paths denied             |
| Patch metadata   | binary, mode, symlink, rename, and copy patches denied                   |
| Dirty files      | dirty touched files denied before approval and rechecked before write    |
| Applicability    | stale hunks rejected with no partial writes                              |
| Output bounds    | long diff preview is truncated with explicit metadata                    |
| Apply path       | approved patch modifies expected files only                              |
| Git boundary     | patch apply does not stage, commit, or push                              |
| CLI preview      | prompt renders preview title, summary, truncated diff, and decision UI   |

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
