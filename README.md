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
- not edit-capable in v0.1.

## Current release

Planned: `v0.1.0 Minimal Coding Agent`

```txt
User Task
→ Agent Loop
→ Tool Calling
→ Safe Repo Read
→ Grounded Final Response
→ JSONL Trace
```

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
packages/tools        read-only tools, validation, and safety policy
packages/providers    provider adapters and normalized provider boundary
fixtures/tiny-ts-repo deterministic smoke-test repository
scripts               smoke and live smoke entrypoints
```

## Current limitations

v0.1 is intentionally read-only.

It does not:

- edit files;
- apply patches;
- use persistent memory;
- run product-level subagents;
- integrate MCP;
- provide sandbox isolation.

## Roadmap

See `docs/roadmap.md`.
