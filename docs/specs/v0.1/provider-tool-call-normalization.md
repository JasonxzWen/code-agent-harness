# 规格：Provider Tool Call Normalization

## 范围 classification

`v0.1 blocker`

本 spec 在 implementation 前定义 provider boundary。除非明确请求 implementation，否则它不授权 coding。

## 问题

Agent loop 必须使用单一 internal provider response contract。OpenAI SDK responses 和 future provider responses 不得泄漏到 `packages/core`。

## 用户可见行为

- Users 看到的 provider errors 是 structured run failures。
- Valid provider tool calls 会触发 tool execution attempts。
- Unsupported provider tool-call variants fail safely，且不会 execute tools。
- Final answers 仍基于 inspected paths grounded。

## 内部设计

Provider adapters 将 SDK responses 转换为：

```ts
export type ProviderResponse =
  | { type: "tool_call"; calls: ToolCall[] }
  | { type: "final"; content: string };
```

Internal tool call shape 保持：

```ts
export interface ToolCall {
  id: string;
  name: string;
  input: JsonObject;
}
```

Core loop 不得 inspect SDK fields，例如 OpenAI `tool_calls`、`function` 或 provider-specific content parts。

## APIs / contracts 契约

Provider adapter responsibilities：

- 接受 normalized agent messages 和 tool specs；
- call the provider SDK；
- 解析 supported provider tool-call variants；
- 将 arguments 转为 `JsonObject`；
- 返回 internal `ProviderResponse`；
- 将 provider failures 转为 structured provider errors。

Core responsibilities：

- build provider-neutral messages；
- 传递 provider-neutral tool specs；
- 只处理 internal `ProviderResponse`；
- 把 SDK-specific parsing 留给 providers。

## 数据 / 状态模型

Provider normalization 必须保留：

- provider call id；
- tool name；
- parsed JSON object input；
- final content；
- provider error kind and message。

Provider-specific raw response objects 不得存入 run state。

## 错误处理

| Case                          | Required behavior                                           |
| ----------------------------- | ----------------------------------------------------------- |
| Malformed tool arguments      | 仅在已测试时 normalize to empty object，否则 provider error |
| Unsupported tool-call variant | 返回 provider error 或 explicit skipped result              |
| Missing tool name             | 返回 provider error                                         |
| Empty final response          | 仅在已记录时返回 empty string final                         |
| SDK request failure           | 返回 `provider_error`                                       |

## Permission / security 考量

- Normalization 不验证 tool safety。
- Normalized calls 仍通过 strict tool validation。
- Provider output 不能绕过 permission gates。
- Raw provider payloads 如果可能包含 secrets，不得写入 trace。

## 测试计划

Required tests：

- OpenAI function tool call 映射到 internal `ToolCall`；
- non-object argument payload 变成 structured error 或 tested fallback；
- unsupported tool-call variant 会 fails safely；
- final message 映射到 internal final response；
- provider errors 映射到 `provider_error`；
- `packages/core` imports no provider SDK types。

## 文档影响

Implementation 完成后更新这些文档：

- `docs/architecture/v0.1-minimal-coding-agent.md`
- `docs/agent/tool-protocol.md`
- `docs/engineering/testing-strategy.md`
- `docs/adr/0004-provider-abstraction.md`，仅当 decision 改变时

## 验收标准

满足以下条件时，本 spec 被 accepted：

- F-05 有 direct test coverage；
- provider adapter tests 覆盖 success 和 failure paths；
- core package boundary checks 保持 clean；
- `bun run quality` passes。

## 非目标

- full Anthropic implementation；
- streaming tool-call support；
- MCP tool protocol；
- core 中的 provider-specific behavior；
- provider fallback or routing。

## Rollout 计划

1. 使用 SDK-shaped fixtures 添加 adapter normalization tests。
2. 确保 OpenAI function tool calls 映射到 internal `ToolCall`。
3. 定义 unsupported variant behavior。
4. 添加 provider error mapping tests。
5. 运行 package-boundary checks 和 quality gates。
