# AGENTS.md

Repository guidance for AI coding agents working on `code-agent-harness`.

Keep this file concise. Detailed process docs live under `docs/engineering/` and task-specific workflows live under `.agents/skills/`.

## Project

`code-agent-harness` is a release-driven TypeScript coding agent harness for real repositories.

It focuses on:

- agent loop runtime;
- tool calling and tool validation;
- repository inspection;
- permission and safety policy;
- context management;
- event traces;
- evaluation readiness;
- terminal-first developer experience.

## Current release

Current target: `v0.1.0 Minimal Coding Agent`.

Locked v0.1 flow:

```txt
User Task
→ Agent Loop
→ Tool Calling
→ Safe Repo Read
→ Grounded Final Response
→ JSONL Trace
```

## Non-goals for v0.1

Do not implement:

- file editing;
- patch application;
- persistent memory;
- subagent orchestration inside the product;
- MCP integration inside the product;
- sandbox runtime;
- eval dashboard;
- IDE extension;
- background task mode.

## Required stack

- TypeScript
- Bun / Node-compatible runtime
- Ink + React for TUI
- Zod for schemas
- OpenAI provider first
- Anthropic provider boundary only in v0.1
- execa for subprocess execution behind policy
- simple-git for read-only git operations where useful

## Repository layout

```txt
apps/cli              Ink TUI and user interaction
packages/core         agent loop, state, config, permission, logging
packages/tools        tool definitions and safe execution
packages/providers    provider adapters and normalized model interface
docs                  architecture, specs, ADRs, releases, research
fixtures              deterministic test repositories
scripts               smoke and developer scripts
.codex                Codex project config, rules, hooks, custom agents
.agents/skills        Codex skills for repeatable workflows
```

## Engineering rules

- Preserve package boundaries.
- Use strict TypeScript.
- Validate external/model-generated input with Zod.
- Keep provider-specific SDK shapes out of `packages/core`.
- Keep TUI business logic out of `packages/core`.
- Keep command execution only inside the approved command tool or scripts.
- Never rely on prompt-only safety; enforce safety in code.
- Add tests for success and failure paths.
- Update docs when public behavior changes.

## Development workflow

For feature work beyond the initial agent loop scaffold:

```txt
research → spec → alignment brief → implementation → quality gates → self-review → final report
```

For v0.1 blockers, do not start implementation until the relevant
`docs/specs/v0.1/` spec exists and acceptance criteria are explicit.

## Quality gates

Run before finishing implementation work:

```bash
bun run format:check
bun run lint
bun run typecheck
bun run build
bun run test
bun run smoke
bun run quality
```

Do not claim a command passed unless it was run and passed.

## Final response format for code changes

```md
## Completed

## Files changed

## Quality gates

| Command              | Result            |
| -------------------- | ----------------- |
| bun run format:check | pass/fail/not run |
| bun run lint         | pass/fail/not run |
| bun run typecheck    | pass/fail/not run |
| bun run build        | pass/fail/not run |
| bun run test         | pass/fail/not run |
| bun run smoke        | pass/fail/not run |

## Self-review

## Known limitations

## Next step
```
