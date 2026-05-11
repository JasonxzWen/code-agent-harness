# OpenAI Provider

## v0.1.1 limitation

`packages/providers/src/openai-provider.ts` uses OpenAI Chat Completions function
tools for tool-call requests, but internal tool results are currently mapped
back to OpenAI as plain `user` messages:

```txt
Tool result from <toolName>:
<json result>
```

It does not yet emit provider-native `tool` messages with `tool_call_id`.
Provider-native mapping also needs the preceding assistant tool-call message in
the message history, which the current provider-neutral core contract does not
retain as an SDK-shaped message.

Decision for `v0.1.1`: document the limitation instead of implementing the
mapping. Implementing it now would require a core/provider message-history
contract change plus adapter tests, which is larger than post-release cleanup
and risks expanding beyond the `v0.1` read-only release boundary.

Expected effect:

- deterministic mock runs and internal tool validation are unaffected;
- live OpenAI runs still receive tool result content, but not with the same
  provider-native tool-call continuity guarantees;
- future provider work should add native tool-result mapping at the adapter
  boundary without leaking OpenAI SDK types into `packages/core`.
