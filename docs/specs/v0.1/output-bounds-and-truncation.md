# Spec: Output Bounds and Truncation

## Scope classification

`v0.1 blocker`

This spec defines documentation and implementation constraints only. It does
not authorize implementation until explicitly requested.

## Problem

The agent loop appends tool results to context and writes traces. Unbounded tool
output can exceed context limits, obscure failures, or leak sensitive values.
v0.1 requires bounded output with explicit truncation metadata.

## User-facing behavior

- Tool output is concise enough for terminal display and model context.
- When output is truncated, the result says so explicitly.
- Final answers do not imply that truncated output was complete.
- Trace files preserve truncation and redaction metadata.

## Internal design

Every tool result must include or allow derivation of:

```txt
truncated: boolean
size before truncation
size returned after truncation
limit applied
```

Tool output must be bounded before it is:

```txt
returned from the tool
→ appended to run state
→ sent back to the provider
→ written to JSONL trace
```

## APIs / contracts

Recommended shared metadata shape:

```ts
export interface ToolOutputMetadata {
  truncated: boolean;
  outputBytes?: number;
  originalBytes?: number;
  outputItems?: number;
  originalItems?: number;
  limit: number;
}
```

Tool-specific output may include additional fields, but truncation must remain
machine-readable.

## Data/state model

Run state must retain:

- bounded output;
- truncation metadata;
- structured error if output could not be safely bounded;
- redacted trace representation.

Raw unbounded output must not be retained in run state or trace files.

## Error handling

| Case                            | Required behavior                                     |
| ------------------------------- | ----------------------------------------------------- |
| Output exceeds limit            | Truncate and set `truncated: true`                    |
| Binary content                  | Return structured denial, not partial binary data     |
| Secret-like output              | Redact before trace write                             |
| Tool cannot safely bound output | Return `tool_execution_error`                         |
| Command timeout                 | Return timeout or execution error with bounded output |

## Permission/security considerations

- Bounds do not make unsafe commands safe.
- Redaction happens independently from truncation.
- Truncated output must still pass path and secret policy.
- Command output must be bounded even after permission approval.

## Testing plan

Required tests:

- file read truncates large text and reports metadata;
- list files truncates by item count and reports metadata;
- search truncates by match count and snippet size;
- command output truncates by configured limit;
- binary data is denied rather than truncated;
- trace output records truncation without unbounded payload;
- final answer fixture can observe truncation metadata.

## Documentation impact

Update these documents when implementation is complete:

- `docs/agent/context-engineering.md`
- `docs/agent/tool-protocol.md`
- `docs/engineering/testing-strategy.md`
- `docs/release/v0.1.0-contract.md`, only if public behavior changes

## Acceptance criteria

This spec is accepted when:

- S-07 has direct test evidence;
- F-07, F-08, and F-09 tests cover bounded outputs;
- trace tests prove bounded/redacted records;
- `bun run quality` passes.

## Non-goals

- repository map;
- semantic file ranking;
- embeddings;
- global context planner;
- persistent context index;
- token-accurate budgeting.

## Rollout plan

1. Normalize truncation metadata shape.
2. Add tests for each tool's output bounds.
3. Ensure event logger writes bounded, redacted records.
4. Update context engineering docs with implemented limits.
5. Run quality gates and record evidence in the release checklist.
