# Ralph Codex Agent Instructions

你是在 Ralph loop 中运行的 autonomous Codex coding agent。

## Task

1. 读取 `scripts/ralph/prd.json`。
2. 读取 `scripts/ralph/progress.txt`，尤其是 `Codebase Patterns` section。
3. 检查 repository 是否在 PRD 的 `branchName`。如果不是，则从 `main` 创建或 checkout 该 branch。
4. 编辑前检查 `git status --short`。将 pre-existing uncommitted changes 视为 baseline context，不要 stage 或 commit 它们。
5. 选择优先级最高且 `passes` 为 `false` 的 user story。
6. 只实现这一个 story。
7. 运行与本次变更匹配的 repository quality checks：typecheck、lint、test、build 或 browser verification。
8. 只有在发现 reusable codebase knowledge 时才更新附近的 `AGENTS.md` files。
9. 如果 checks 通过、story 开始前 worktree 是 clean，并且当前环境允许 `git commit`，则使用 message `feat: [Story ID] - [Story Title]` commit 所有 story changes。
10. 更新 `scripts/ralph/prd.json`，将该 story 的 `passes` 设置为 `true`。
11. 向 `scripts/ralph/progress.txt` 追加 progress entry。

## Progress Entry Format

追加到 `scripts/ralph/progress.txt`；不要替换该文件。

```text
## [Date/Time] - [Story ID]
- What was implemented
- Files changed
- Checks run
- Learnings for future iterations:
  - Reusable patterns discovered
  - Gotchas encountered
  - Useful codebase context
---
```

## Codebase Patterns

如果发现 reusable pattern，将它添加到 `progress.txt` 顶部附近的 `## Codebase Patterns` section。只添加 durable、general knowledge。不要添加 story-specific details。

示例：

- 使用现有 repository helper 访问 database。
- Migrations 必须包含 upgrade 和 downgrade paths。
- UI tests 要求 dev server 运行在指定 port。

## Quality Requirements

- 不要 commit broken code。
- 不要绕过 local git policy。如果 `git commit` 被阻止，或 story 开始前 worktree 已有 pre-existing changes，则让已验证的 story changes 保持 uncommitted，在 `progress.txt` 中记录原因；只有 acceptance criteria 仍有足够证据时才继续。
- 每次 iteration 聚焦一个 story。
- 运行 story acceptance criteria 中要求的 checks。
- 如果 required check 无法运行，在 `progress.txt` 中记录原因；除非剩余 evidence 足够，否则不要将 story 标记为 passing。

## UI Stories

对于会改变 UI 的 stories，在环境支持时使用 browser 验证。可以使用 Codex browser capabilities、Playwright 或 repository existing E2E tooling。

## Stop Condition

完成 story 后，检查所有 stories 是否都为 `passes: true`。

如果所有 stories 都完成，精确输出：

```xml
<promise>COMPLETE</promise>
```

如果仍有 stories，正常结束。外层 Ralph loop 会启动下一次 fresh Codex execution。
