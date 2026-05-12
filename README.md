# Code Agent Harness

A release-driven TypeScript coding agent harness for real-world repositories.

`code-agent-harness` is a terminal-first developer tool for building and
evolving coding agents with explicit runtime contracts: agent loops, tool
calling, safe repository inspection, permissions, context management, trace
logging, and evaluation readiness.

## What it is

- a local coding agent harness;
- a terminal-first developer tool;
- a TypeScript agent runtime;
- a tool-calling system with validated schemas;
- a permission-aware repository inspection workflow;
- a release-driven engineering project.

## What it is not

- not a chatbot wrapper;
- not a demo website;
- not a general assistant;
- not a Devin clone;
- not edit-capable in the current v0.1 release;
- not an auto-commit or auto-PR bot.

## Current release

Current release: `v0.1.0 Minimal Coding Agent`

```txt
User Task
→ Agent Loop
→ Tool Calling
→ Safe Repo Read
→ Grounded Final Response
→ JSONL Trace
```

## In Development

Target: `v0.2.0 Patch-capable Agent`

```txt
User Task
-> Agent Loop
-> Tool Calling
-> Safe Repo Read
-> Patch Preview
-> Explicit Approval
-> Apply Patch
-> Grounded Final Response
-> JSONL Trace
```

v0.2 adds one controlled write tool:

```txt
apply_patch: ask
```

`apply_patch` preflights unified diffs, rejects deterministic policy failures,
shows a preview before approval, revalidates before writing, and writes only to
the working tree. It does not stage, commit, push, add sandboxing, or broaden
`run_command`.

## Quickstart

```bash
bun install
bun run build
bun run dev -- --repo fixtures/tiny-ts-repo --task "Explain this repository structure and identify the main modules."
```

During an active TUI run, press `q` or `Ctrl+C` to abort the run.

The build command emits `dist/agent-harness.js`. After building, run the CLI
bundle with:

```bash
bun dist/agent-harness.js --repo fixtures/tiny-ts-repo --task "Explain this repository structure and identify the main modules."
```

Example task:

```txt
Explain this repository structure and identify the main modules.
```

## Architecture

```txt
apps/cli
  └─ Ink TUI
      └─ packages/core
          ├─ Agent Controller
          ├─ Provider Client
          ├─ Tool Registry
          ├─ Permission Gate
          └─ JSONL Event Logger
```

## Safety model

v0.1 defaults:

```txt
read tools: allow
restricted commands: ask
write operations: unavailable
```

v0.2 development defaults:

```txt
read tools: allow
restricted commands: ask
apply_patch: ask
```

## Development

```bash
bun install
bun run format
bun run format:check
bun run lint
bun run typecheck
bun run build
bun run test
bun run smoke
bun run quality
```

## Workspace

```txt
apps/cli              Ink TUI and user interaction
packages/core         agent loop, config, events, and public runtime contracts
packages/tools        read tools, apply_patch, validation, and safety policy
packages/providers    provider adapters and normalized provider boundary
fixtures/tiny-ts-repo deterministic smoke-test repository
scripts               smoke and live smoke entrypoints
```

## Current limitations

v0.1 is intentionally read-only.

v0.2 patch support is intentionally narrow. It does not:

- auto-stage, auto-commit, auto-push, or create PRs;
- apply binary, mode, symlink, rename, or copy patches;
- modify secret-looking paths;
- resolve merge conflicts automatically;
- use persistent memory;
- run product-level subagents;
- integrate MCP;
- provide sandbox isolation.

Live OpenAI runs also inherit the current provider limitation documented in
`docs/agent/openai-provider.md`: tool results are passed back as plain `user`
messages, not provider-native `tool_call_id` messages.

## Roadmap

See `docs/roadmap.md`.
