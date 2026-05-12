# 变更日志

本文件记录项目的重要变更。

## [Unreleased]

### 新增

- `v0.2.1 Chinese-first Repository Migration` 的 contract、research、spec、readiness gap list 和语言政策入口。
- README、CHANGELOG、AGENTS、文档模板和仓库 skills 的第一批中文优先迁移。
- 全仓 Markdown 文档完成中文优先迁移，覆盖 `docs/**`、`.codex/hooks/README.md`、`MANIFEST.md`、`scripts/ralph/CODEX.md` 和 fixture README。
- v0.2.1 新增核心源码中文注释要求：UTF-8 编码，注释解释 what、why、how，让新手能顺畅阅读核心逻辑。
- v0.2 core preview contract：`ToolPreview`、`PreparedToolCall.preview` 和 `PermissionRequest.preview`。
- `apply_patch` 作为第一个受控写入工具，默认 `ask`，写入前必须展示 diff preview 并获得批准。
- Patch policy tests，覆盖 invalid patches、path traversal、symlink escape、secret paths、binary/mode/symlink patches、dirty touched files、non-applicable patches、oversized patches、preview truncation 和无 hidden stage/commit 行为。

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
