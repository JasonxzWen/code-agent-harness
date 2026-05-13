# v0.3 Eval Report Privacy Spec

## 目标

v0.3 eval report 是本地 release review artifact，但它仍可能被截图、复制到 issue、贴进 PR 或发送给 reviewer。因此报告内容必须默认可分享，不得泄露运行机器、用户身份或 secret。

本规范适用于 `bun run eval -- --suite v0.3` 生成的全部报告：

- `report.json`
- `report.md`
- `report.html`
- report data model 中的 `outputDir`、`reportPaths`、`tracePath`、`worktreePath`、`commandsRun`、`releaseLog`、check evidence、error message 和 final answer excerpt

## 强制规则

- 报告中严禁出现本机绝对路径，包括 Windows drive path、UNC path、`/home/<user>/...`、`/Users/<user>/...`。
- 报告中严禁出现用户主目录、系统用户名、profile path、机器相关目录或其他可识别个人环境的信息。
- 报告中严禁出现 API key、GitHub token、AWS access key、private key 内容或其他 token-looking secret。
- 内部执行可以继续使用绝对路径，但进入 report data model 前必须转换为 repo-relative path；当输出目录位于 repo 外部时，只能显示 `[external-output]/...` 形式。
- Markdown 和 HTML 报告必须从已经脱敏的同一 report data model 渲染，不得在 renderer 中重新读取或拼接内部绝对路径。
- HTML 报告必须继续对来自 trace、tool output、final answer、file path 和 check evidence 的文本做 escaping。
- 写入报告前必须对 JSON、Markdown 和 HTML 三个实际输出执行隐私扫描；发现泄露时应失败，而不是写出不合规报告。

## 允许的路径形式

```txt
.agent-harness/evals/latest/report.html
.agent-harness/evals/latest/traces/inspection-tiny-ts.jsonl
[external-output]/report.html
[external-output]/traces/inspection-tiny-ts.jsonl
```

## 禁止的路径形式

```txt
D:\code-agent-harness\.agent-harness\evals\latest\report.html
C:\Users\alice\AppData\Local\Temp\agent-harness-eval\report.json
/home/alice/code-agent-harness/.agent-harness/evals/latest/report.md
/Users/alice/Downloads/report.html
```

## 验收标准

- 单元测试覆盖 report privacy scanner、路径脱敏和 token-looking secret 脱敏。
- E2E eval 生成的 `report.json`、`report.md` 和 `report.html` 不包含绝对路径、用户目录或 token-looking secret。
- HTML browser smoke 只能打开已脱敏报告；如果报告隐私扫描失败，browser smoke 不得被记录为通过。
- release readiness checklist 必须把 report privacy 作为 HTML report 汇报能力的一部分验收。
