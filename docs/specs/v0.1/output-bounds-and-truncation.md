# 规格：Output Bounds and Truncation

## Scope classification

`v0.1 blocker`

本 spec 只定义 documentation 和 implementation constraints。除非明确请求 implementation，否则它不授权开始实现。

## Problem

Agent loop 会把 tool results append 到 context，并写入 traces。Unbounded tool output 可能超过 context limits、掩盖 failures，或泄漏 sensitive values。v0.1 要求 bounded output，并带有 explicit truncation metadata。

## User-facing behavior

- Tool output 足够简洁，可以用于 terminal display 和 model context。
- Output 被 truncated 时，result 会明确说明。
- Final answers 不暗示 truncated output 是完整的。
- Trace files 保留 truncation 和 redaction metadata。

## Internal design

每个 tool result 必须包含或可推导：

```txt
truncated: boolean
size before truncation
size returned after truncation
limit applied
```

Tool output 必须在以下步骤前完成 bounded：

```txt
returned from the tool
→ appended to run state
→ sent back to the provider
→ written to JSONL trace
```

## APIs / contracts

推荐的 shared metadata shape：

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

Tool-specific output 可以包含额外字段，但 truncation 必须保持 machine-readable。

## Data/state model

Run state 必须保留：

- bounded output；
- truncation metadata；
- 如果 output 无法 safely bounded，则保留 structured error；
- redacted trace representation。

Raw unbounded output 不得保留在 run state 或 trace files 中。

## Error handling

| Case                            | Required behavior                                   |
| ------------------------------- | --------------------------------------------------- |
| Output exceeds limit            | 截断并设置 `truncated: true`                        |
| Binary content                  | 返回 structured denial，而不是 partial binary data  |
| Secret-like output              | 写入 trace 前完成 redact                            |
| Tool cannot safely bound output | 返回 `tool_execution_error`                         |
| Command timeout                 | 返回 timeout 或带 bounded output 的 execution error |

## Permission / security considerations

- Bounds 不会让 unsafe commands 变安全。
- Redaction 独立于 truncation 发生。
- Truncated output 仍必须通过 path 和 secret policy。
- Command output 即使在 permission approval 后也必须 bounded。

## Testing plan

Required tests：

- file read 会 truncate large text 并 reports metadata；
- list files 会按 item count truncate 并 reports metadata；
- search 会按 match count 和 snippet size truncate；
- command output 会按 configured limit truncate；
- binary data 被 denied，而不是 truncated；
- trace output 记录 truncation，且不包含 unbounded payload；
- final answer fixture 能 observe truncation metadata。

## Documentation impact

Implementation 完成后更新这些文档：

- `docs/agent/context-engineering.md`
- `docs/agent/tool-protocol.md`
- `docs/engineering/testing-strategy.md`
- `docs/releases/v0.1.0-contract.md`，仅当 public behavior 改变时

## Acceptance criteria

满足以下条件时，本 spec 被 accepted：

- S-07 有 direct test evidence；
- F-07、F-08 和 F-09 tests 覆盖 bounded outputs；
- trace tests 证明 bounded/redacted records；
- `bun run quality` passes。

## Non-goals

- repository map；
- semantic file ranking；
- embeddings；
- global context planner；
- persistent context index；
- token-accurate budgeting。

## Rollout plan

1. 归一化 truncation metadata shape。
2. 为每个 tool 的 output bounds 添加 tests。
3. 确保 event logger 写入 bounded、redacted records。
4. 用 implemented limits 更新 context engineering docs。
5. 运行 quality gates，并在 release checklist 中记录 evidence。
