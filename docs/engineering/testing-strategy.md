# 测试策略

## 测试金字塔

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

## E2E 验收规则

User-visible release features 不能只靠 unit tests 发布。每个此类 feature 至少需要一条 E2E acceptance path，从 user-level entrypoint 开始，并验证最终可观察证据。

可接受的 E2E evidence 包括：

- 从 task input 到 final answer 的 CLI 或 TUI workflow；
- deterministic provider + real tool registry + fixture repository 的组合路径；
- 能证明 workflow boundary 的 generated trace 或 artifact；
- 只有在无法自动化时才允许记录 manual step，并必须说明原因和 expected evidence。

如果 user-visible feature 只有 unit tests，release readiness 必须将其标记为 blocker，或记录明确例外。

## Benchmark 规则

每个 release feature 都需要 benchmark question 和可度量证据。benchmark 可以在无法直接执行 competitor 时比较其公开实践，但不得暗示已执行 ranking，除非确实在记录条件下运行过 competitor。

Benchmark evidence 应记录：

- scenario 和 fixture；
- metrics 和 thresholds；
- commands 或 artifacts；
- result 和 caveats；
- 来自 Codex、Claude Code、opencode 或 release-relevant peer 的 peer baseline。

## v0.1 必需测试

| Area            | Required tests                                                   |
| --------------- | ---------------------------------------------------------------- |
| Config          | defaults、invalid config、override order 行为                    |
| Path policy     | inside root、outside root、symlink escape 场景                   |
| Secret policy   | `.env`、private keys、`.npmrc` denied 场景                       |
| File reading    | text read、truncation、binary denial 场景                        |
| Listing         | ignored paths 和 stable order                                    |
| Search          | snippets、result limit、ignored paths 场景                       |
| Command policy  | allowlist command、write command denied、shell token denied 场景 |
| Permission gate | request event、decision event、denied tool not executed 场景     |
| Tool registry   | unknown tool、invalid input、extra input、valid execution 场景   |
| Agent loop      | tool call -> result -> final                                     |
| Event logger    | writes JSONL 和 redacts secrets 行为                             |
| TUI smoke       | renders initial state                                            |
| Build           | CLI bundle builds successfully                                   |

## v0.2 patch 必需测试

| Area             | Required tests                                                           |
| ---------------- | ------------------------------------------------------------------------ |
| Core contract    | `PermissionRequest.preview`、bounded preview trace、result metadata 契约 |
| Permission gate  | denied permission 不执行；policy-denied preflight 不发起 ask             |
| Patch validation | invalid patch syntax 和 extra input fields                               |
| Path policy      | path traversal 和 symlink escape denied                                  |
| Secret policy    | `.env`、`.pem`、`.key` 和 private key-looking paths denied               |
| Patch metadata   | binary、mode、symlink、rename 和 copy patches denied                     |
| Dirty files      | approval 前拒绝 dirty touched files，写入前重新检查                      |
| Applicability    | stale hunks rejected，且 no partial writes                               |
| Output bounds    | long diff preview is truncated，并有 explicit metadata                   |
| Apply path       | approved patch 只修改 expected files                                     |
| Git boundary     | patch apply 不 stage、commit 或 push                                     |
| CLI preview      | prompt renders preview title、summary、truncated diff 和 decision UI     |

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

Live provider tests 不属于 CI。
