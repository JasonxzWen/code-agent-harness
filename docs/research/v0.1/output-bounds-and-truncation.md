# Research: Output Bounds and Truncation

## Problem

v0.1 tools inspect real repositories, so file reads, searches, git output, and
command output can exceed the context budget or hide unsafe content in large
payloads. The release contract requires bounded output and explicit truncation,
but the project needs a pre-implementation contract for where bounds are
enforced and how truncation is reported.

## Release relevance

Scope classification: `v0.1 blocker`.

This work maps to:

- F-07 file listing;
- F-08 file reading;
- F-09 search;
- S-07 output bounds;
- S-09 redaction;
- eval-lite trace usefulness.

## Sources reviewed

- `docs/releases/v0.1.0-contract.md`
- `docs/agent/context-engineering.md`
- `docs/agent/tool-protocol.md`
- `docs/agent/evaluation-strategy.md`
- `docs/engineering/testing-strategy.md`
- `docs/architecture/v0.1-minimal-coding-agent.md`

## Industry practice

Agent systems generally bound tool output before appending it to model context.
For v0.1, the project should avoid advanced context engineering and keep a
simple invariant: every tool result is bounded, structured, and explicit about
truncation.

## Alternatives considered

| Option                 | Description                            | Decision                                   |
| ---------------------- | -------------------------------------- | ------------------------------------------ |
| No bounds              | Return full tool output                | Reject: unsafe and violates S-07           |
| Prompt-only brevity    | Ask the model to request small outputs | Reject: prompt-only safety is insufficient |
| Per-tool bounds only   | Each tool truncates independently      | Accept for v0.1                            |
| Global context planner | Rank and budget all context centrally  | Defer to v0.4                              |

## Trade-off matrix

| Criterion           | Per-tool bounds | Global planner |
| ------------------- | --------------- | -------------- |
| v0.1 simplicity     | High            | Low            |
| Safety              | High            | High           |
| Context quality     | Medium          | High           |
| Implementation cost | Low             | High           |
| Eval readiness      | Medium          | High           |

## Project-specific constraints

- v0.1 must remain tool-driven and read-only.
- No embeddings, repo map, ranking system, or persistent index.
- Tool output must be safe to append to the agent loop.
- Truncation metadata must be present in structured results and traces.
- Redaction must happen before sensitive values can be written to trace logs.

## Recommendation

Use per-tool output limits for v0.1:

- `list_files` limits file count and reports `truncated`;
- `read_file` limits bytes and reports size metadata;
- `search_repo` limits matches and snippets;
- `git_status` returns structured status, not raw unbounded output;
- `run_command` enforces timeout and output length.

Every bounded tool result must expose enough metadata for the final answer to
avoid overstating completeness.

## Acceptance criteria impacted

- F-07 stable, bounded file list.
- F-08 safe text file reads.
- F-09 bounded search snippets.
- S-07 explicit truncation metadata.
- S-09 trace redaction.

## Open questions

- Should the first release use one shared output metadata shape for every tool,
  or allow tool-specific metadata?
- Should final answers be required to mention truncation when relevant?
- Should command output use byte limits, character limits, or both?
