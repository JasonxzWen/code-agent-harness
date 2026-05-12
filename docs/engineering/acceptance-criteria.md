# 验收标准

验收标准分为五个区域。

## Functional

- CLI 可以启动。
- 用户可以提交 task。
- Agent 创建 run ID。
- Provider 接收 messages 和 tools。
- Tool calls 归一化为 internal calls。
- Tool inputs 通过 schemas 验证。
- 安全的 repo files 可以 list/read/search。
- Git status 以 read-only 方式工作。
- 受限 command execution 会请求 permission。
- Final answer 引用已 inspected paths。
- JSONL trace 被写入。
- Run 可以 abort。

## Safety

- 阻止 path traversal。
- 阻止 symlink escape。
- 拒绝 secret files。
- 拒绝 binary files。
- 拒绝 destructive commands。
- Output 有边界，且 truncation 显式。
- v0.1 不存在 write-capable tool。
- Logs 不包含 secrets 或 API keys。

## Engineering

- strict typecheck passes；
- lint passes；
- format check passes；
- build passes；
- tests pass；
- smoke passes；
- package boundaries hold；
- config/tool/event contracts 有 schemas。

## Documentation

- README complete；
- charter complete；
- roadmap complete；
- v0.1 architecture complete；
- ADRs complete；
- release note complete；
- testing strategy complete；
- tool and permission docs complete；
- 从 `v0.2.0` 开始，新增 release-facing docs 使用中文正文。

## E2E Acceptance

User-visible features 必须证明完整 user workflow，而不是只验证内部 units。

除非满足以下条件，否则不要接受 release feature：

```txt
[ ] user-level scenario defined
[ ] fixture or input defined
[ ] command or manual steps recorded
[ ] final answer, artifact, trace, or worktree evidence recorded
[ ] failure path covered or explicitly deferred
```

## Benchmark

每个 release feature 必须有 benchmark question，以及 quantitative 或 structured comparison evidence。

除非满足以下条件，否则不要接受 benchmark evidence：

```txt
[ ] primary scenario documented
[ ] peer baseline documented
[ ] metric and threshold documented
[ ] command or artifact documented
[ ] result recorded honestly
[ ] caveats recorded when competitors were not directly executed
```

## Release

除非满足以下条件，否则不要 release：

```txt
[ ] scope matches release contract
[ ] no out-of-scope feature slipped in
[ ] quality gate passes
[ ] build passes
[ ] smoke test passes
[ ] e2e acceptance recorded for user-visible features
[ ] benchmark evidence recorded for release features
[ ] README updated
[ ] CHANGELOG updated
[ ] release note written
[ ] known limitations documented
```
