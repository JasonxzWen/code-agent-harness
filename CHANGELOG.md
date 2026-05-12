# Changelog

All notable changes to this project will be documented here.

## [Unreleased]

### Added

- v0.2 core preview contract with `ToolPreview`,
  `PreparedToolCall.preview`, and `PermissionRequest.preview`.
- `apply_patch` as the first controlled write tool, defaulting to `ask` and
  requiring diff preview approval before writing.
- Patch policy tests for invalid patches, path traversal, symlink escape,
  secret paths, binary/mode/symlink patches, dirty touched files,
  non-applicable patches, oversized patches, preview truncation, and no hidden
  stage/commit behavior.

## [0.1.1] - 2026-05-11

### Changed

- Updated README release wording to show `v0.1.0 Minimal Coding Agent` as the
  current released scope.
- Removed personal model/profile preferences from the project-scoped Codex
  config while preserving project-level safety settings.
- Documented the current OpenAI provider tool-result mapping limitation.

## [0.1.0] - 2026-05-11

### Added

- Bun workspace scaffold.
- CLI, core, tools, and providers packages.
- Tiny TypeScript fixture repository.
- Format, lint, typecheck, build, test, smoke, and quality scripts.
- GitHub Actions quality workflow.
- Example `.agent-harness` configuration.
- v0.1 safety hardening evidence for strict tool validation, permission
  decisions, and the read-only command allowlist.
- Terminal-first TUI.
- Minimal agent loop.
- Provider abstraction with OpenAI first.
- Validated tool protocol.
- Safe repository inspection tools.
- Permission gate for restricted commands.
- JSONL event trace.
- Config system.
- Quality gates and smoke tests.
