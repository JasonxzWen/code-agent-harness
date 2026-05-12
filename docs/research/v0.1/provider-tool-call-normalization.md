# 调研：Provider Tool Call Normalization

## Problem

v0.1 优先使用 OpenAI，同时保持 provider abstraction boundary。Provider SDKs 暴露的 tool-call shapes 不同，但 `packages/core` 必须接收一个 internal `ToolCall` contract，并且不得 import provider SDK types。

## Release relevance

Scope classification：`v0.1 blocker`。

本工作映射到：

- F-04 provider call；
- F-05 tool normalization；
- F-06 tool validation；
- engineering standards 中的 provider boundary requirements。

## Sources reviewed

- `docs/releases/v0.1.0-contract.md`
- `docs/architecture/v0.1-minimal-coding-agent.md`
- `docs/adr/0004-provider-abstraction.md`
- `docs/agent/tool-protocol.md`
- `docs/engineering/standards.md`
- `docs/engineering/testing-strategy.md`

## Industry practice

Agent runtimes 通常在 adapter boundaries 归一化 provider responses。这样在 SDK response shapes、model capabilities 或 provider-specific tool-call variants 改变时，core loop 仍能保持稳定。

## Alternatives considered

| Option                                   | Description                                      | Decision                    |
| ---------------------------------------- | ------------------------------------------------ | --------------------------- |
| Core reads provider SDK shapes           | Agent loop 直接处理 SDK responses                | 拒绝：违反 package boundary |
| Provider returns loosely typed JSON      | Core 从零校验全部内容                            | 拒绝：adapter contract 太弱 |
| Adapter normalizes to internal contract  | Provider package 把 SDK shapes 映射到 `ToolCall` | 采用                        |
| Full multi-provider normalization matrix | 在 v0.1 实现全部 provider variants               | 拒绝：scope expansion       |

## Trade-off matrix

| Criterion 指标          | Core SDK handling | Adapter normalization |
| ----------------------- | ----------------- | --------------------- |
| Boundary preservation   | 低                | 高                    |
| v0.1 simplicity         | 中                | 高                    |
| OpenAI-first delivery   | 中                | 高                    |
| Future provider support | 低                | 中                    |
| Testability             | 低                | 高                    |

## Project-specific constraints

- `packages/core` 不得 import OpenAI 或 Anthropic SDK types。
- `packages/providers` 不得 execute tools。
- Anthropic 在 v0.1 中保持 boundary stub。
- Unknown 或 unsupported provider tool-call variants 必须 fail safely。
- Normalized calls 仍必须在 `packages/tools` 中通过 strict tool validation。

## Recommendation

将 provider-specific parsing 保留在 `packages/providers` 中。OpenAI adapter 必须把 supported function tool calls 映射为 internal `ToolCall` shape：

```txt
{ id, name, input }
```

Unsupported tool-call variants 应产生 provider error，或只在 explicit 且已测试的情况下被 ignored。adapter 不得把 raw SDK objects 传给 core。

## Acceptance criteria impacted

- F-04：provider receives normalized messages and tool specs 已覆盖。
- F-05：provider tool calls normalize into internal calls 已覆盖。
- F-06：normalized input 由 tool registry validation。
- Engineering：provider SDK types stay out of core 已覆盖。

## Open questions

- Unsupported tool-call variants 应 fail the run，还是 skipped with a trace event？
- Adapter tests 应使用 SDK-shaped fixture objects，还是 higher-level provider responses？
- Anthropic stub 应暴露 normalization placeholder，还是在 release target 改变前保持 hard error？
