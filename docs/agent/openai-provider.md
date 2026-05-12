# OpenAI Provider

## v0.1.1 limitation

`packages/providers/src/openai-provider.ts` 使用 OpenAI Chat Completions function tools 发起 tool-call requests，但 internal tool results 当前会映射回普通 `user` messages：

```txt
Tool result from <toolName>:
<json result>
```

它尚未发出 provider-native `tool` messages with `tool_call_id`。Provider-native mapping 还需要 message history 中保留前一个 assistant tool-call message，而当前 provider-neutral core contract 不把该消息保留为 SDK-shaped message。

`v0.1.1` 的决策：记录该 limitation，而不是现在实现 mapping。现在实现会要求 core/provider message-history contract change 和 adapter tests；这比 post-release cleanup 更大，并且有扩大 `v0.1` read-only release boundary 的风险。

Expected effect：

- deterministic mock runs 和 internal tool validation 不受影响；
- live OpenAI runs 仍会收到 tool result content，但没有同等 provider-native tool-call continuity guarantees；
- future provider work 应在 adapter boundary 添加 native tool-result mapping，且不要把 OpenAI SDK types 泄漏到 `packages/core`。
