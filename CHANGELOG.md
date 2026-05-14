# 变更日志

本文件记录项目的重要变更。

## [Unreleased]

### 新增

- 新增项目本地 `html-work-reports` skill，包含自包含 HTML 工作汇报的生成器、校验器、模板、静态组件和结构化输入 schema。

### 变更

- 强化开发完成 HTML 变更汇报规范：默认使用生成器和 validator，要求 source-linked code evidence，并明确 browser smoke 降级不能写成通过。

## [0.3.0] - 2026-05-13

### 新增

- `v0.2.1 Chinese-first Repository Migration` 的 contract、research、spec、readiness gap list 和语言政策入口。
- README、CHANGELOG、AGENTS、文档模板和仓库 skills 的第一批中文优先迁移。
- 全仓 Markdown 文档完成中文优先迁移，覆盖 `docs/**`、`.codex/hooks/README.md`、`MANIFEST.md`、`scripts/ralph/CODEX.md` 和 fixture README。
- v0.2.1 新增核心源码中文注释要求：UTF-8 编码，注释解释 what、why、how，让新手能顺畅阅读核心逻辑。
- v0.2 core preview contract：`ToolPreview`、`PreparedToolCall.preview` 和 `PermissionRequest.preview`。
- `apply_patch` 作为第一个受控写入工具，默认 `ask`，写入前必须展示 diff preview 并获得批准。
- Patch policy tests，覆盖 invalid patches、path traversal、symlink escape、secret paths、binary/mode/symlink patches、dirty touched files、non-applicable patches、oversized patches、preview truncation 和无 hidden stage/commit 行为。
- `v0.3 Evaluation Harness`：新增 `bun run eval -- --suite v0.3 --out <dir>`，运行 fixed deterministic task matrix，解析 JSONL trace，执行 deterministic checks，并输出 JSON / Markdown / self-contained HTML reports。
- v0.3 HTML report 支持 status filter、展开/折叠检查和失败摘要复制，用于本地 release review，不引入 dashboard、线上服务或 leaderboard。
- v0.3 HTML report 新增 release log 数据区，从 `CHANGELOG.md` 解析 version、date、status、sections 和 items，在同一 report writer 中呈现 release timeline。
- v0.3 report privacy spec：JSON / Markdown / HTML reports 严禁输出本机绝对路径、用户主目录、系统用户名或 token-looking secret；报告路径统一转换为 repo-relative path 或 `[external-output]/...`。

## [0.1.1] - 2026-05-11

### 变更

- 更新 README release wording，说明 `v0.1.0 Minimal Coding Agent` 是当时的已发布范围。
- 从项目级 Codex config 移除个人 model/profile 偏好，同时保留项目级 safety settings。
- 记录当前 OpenAI provider tool-result mapping limitation。

## [0.1.0] - 2026-05-11

### 新增

- Bun workspace scaffold。
- CLI、core、tools 和 providers packages。
- 小型 TypeScript fixture repository。
- format、lint、typecheck、build、test、smoke 和 quality scripts。
- GitHub Actions quality workflow。
- 示例 `.agent-harness` configuration。
- v0.1 safety hardening evidence，覆盖 strict tool validation、permission decisions 和 read-only command allowlist。
- Terminal-first TUI。
- Minimal agent loop。
- OpenAI-first 的 provider abstraction。
- Validated tool protocol。
- 安全的 repository inspection tools。
- restricted commands 的 permission gate。
- JSONL event trace。
- Config system。
- Quality gates 和 smoke tests。
