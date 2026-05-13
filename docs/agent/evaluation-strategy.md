# Evaluation strategy 说明

v0.1 不实现完整 eval harness，但必须保留未来构建 eval harness 所需的数据。

## v0.1 eval-lite 说明

- deterministic smoke test；
- fixture repo；
- mock provider agent loop test；
- JSONL event trace；
- final answer grounding 要求。

## v0.3 目标

- fixed fixture tasks；
- trace scoring；
- behavior regression；
- 本地 JSON / Markdown / HTML reports；
- cost/latency 字段只在可采集时记录，不能猜测；
- live provider comparison 保持 later / optional。

## v0.3 已实现入口

```bash
bun run eval -- --suite v0.3 --out .agent-harness/evals/latest
```

当前 deterministic suite 覆盖：

- read-only inspection：复用 `fixtures/tiny-ts-repo`、mock provider 和真实 read tools；
- patch approval：在隔离 git worktree 中验证 `apply_patch`、permission preview、file change、no staged changes 和 no new commit；
- patch denial：验证 `permission_denied` 时无写入、无 staged changes、无新 commit；
- command policy denial：验证 unsafe `run_command` 在 permission 前被 deterministic policy 拒绝。

报告输出：

- `report.json`：机器可读契约；
- `report.md`：线性 review 文档；
- `report.html`：自包含 HTML 审查 artifact，支持 status filter、展开/折叠检查和失败摘要复制。
- `releaseLog`：从 `CHANGELOG.md` 解析 release timeline、section 和条目，并在 HTML report 中呈现。

报告隐私要求：所有 eval reports 只能显示 repo-relative path 或 `[external-output]/...`，严禁包含本机绝对路径、用户主目录、系统用户名或 token-looking secret。JSON、Markdown 和 HTML 输出写入前必须通过 report privacy scan。

## 候选指标

| 指标                   | 含义                           |
| ---------------------- | ------------------------------ |
| valid tool call rate   | args 通过 schema               |
| grounding rate         | answer 引用已检查文件          |
| unsafe request rate    | model request 被拒绝的操作比例 |
| step count             | 效率信号                       |
| repeated failure count | 鲁棒性信号                     |
| truncation handling    | context discipline 信号        |
| latency                | runtime performance            |

## 当前 v0.3 benchmark 证据

2026-05-13 本地运行：

```bash
bun run eval -- --suite v0.3 --out .agent-harness/evals/latest
```

结果：

| 指标                    | 结果 |
| ----------------------- | ---- |
| `taskPassRate`          | 100% |
| `requiredCheckPassRate` | 100% |
| `traceParseRate`        | 100% |
| `safetyDenialRate`      | 100% |
| `unexpectedWriteCount`  | 0    |
| `report_completeness`   | pass |
| `html_review_smoke`     | pass |
| `report_privacy`        | pass |
| `release_log_html`      | pass |
