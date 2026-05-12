# 调研：Output Bounds and Truncation

## Problem

v0.1 tools 会 inspect 真实 repositories，因此 file reads、searches、git output 和 command output 可能超过 context budget，或在大 payload 中隐藏 unsafe content。release contract 要求 bounded output 和 explicit truncation，但项目需要在 implementation 前定义：bounds 在哪里执行，以及 truncation 如何报告。

## Release relevance

Scope classification：`v0.1 blocker`。

本工作映射到：

- F-07 file listing；
- F-08 file reading；
- F-09 search；
- S-07 output bounds；
- S-09 redaction；
- eval-lite trace usefulness。

## Sources reviewed

- `docs/releases/v0.1.0-contract.md`
- `docs/agent/context-engineering.md`
- `docs/agent/tool-protocol.md`
- `docs/agent/evaluation-strategy.md`
- `docs/engineering/testing-strategy.md`
- `docs/architecture/v0.1-minimal-coding-agent.md`

## Industry practice

Agent systems 通常会在把 tool output append 到 model context 前做边界限制。对 v0.1，本项目应避免 advanced context engineering，保持一个简单 invariant：每个 tool result 都 bounded、structured，并明确说明 truncation。

## Alternatives considered

| Option                 | Description                        | Decision                        |
| ---------------------- | ---------------------------------- | ------------------------------- |
| No bounds              | 返回完整 tool output               | 拒绝：unsafe 且违反 S-07        |
| Prompt-only brevity    | 要求 model 主动请求 small outputs  | 拒绝：prompt-only safety 不足够 |
| Per-tool bounds only   | 每个 tool 独立 truncate            | v0.1 采用                       |
| Global context planner | 中央化 rank 和 budget 全部 context | 延后到 v0.4                     |

## Trade-off matrix

| Criterion 指标      | Per-tool bounds | Global planner |
| ------------------- | --------------- | -------------- |
| v0.1 simplicity     | 高              | 低             |
| Safety              | 高              | 高             |
| Context quality     | 中              | 高             |
| Implementation cost | 低              | 高             |
| Eval readiness      | 中              | 高             |

## Project-specific constraints

- v0.1 必须保持 tool-driven 和 read-only。
- 不使用 embeddings、repo map、ranking system 或 persistent index。
- Tool output 必须可以安全 append 到 agent loop。
- Truncation metadata 必须出现在 structured results 和 traces 中。
- Redaction 必须在 sensitive values 写入 trace logs 前完成。

## Recommendation

v0.1 使用 per-tool output limits：

- `list_files` 限制 file count 并报告 `truncated`；
- `read_file` 限制 bytes 并报告 size metadata；
- `search_repo` 限制 matches 和 snippets；
- `git_status` 返回 structured status，而不是 raw unbounded output；
- `run_command` 强制 timeout 和 output length。

每个 bounded tool result 都必须暴露足够 metadata，让 final answer 不会夸大 completeness。

## Acceptance criteria impacted

- F-07 stable, bounded file list。
- F-08 safe text file reads。
- F-09 bounded search snippets。
- S-07 explicit truncation metadata 已覆盖。
- S-09 trace redaction。

## Open questions

- 第一个 release 是否为每个 tool 使用同一个 shared output metadata shape，还是允许 tool-specific metadata？
- Final answers 在相关时是否必须提及 truncation？
- Command output 应使用 byte limits、character limits，还是两者都用？
