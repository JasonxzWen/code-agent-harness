# Spec: Provider Tool Call Normalization

## Scope classification

`v0.1 blocker`

This spec defines the provider boundary before implementation. It does not
authorize coding until implementation is explicitly requested.

## Problem

The agent loop must work with one internal provider response contract. OpenAI
SDK responses and future provider responses must not leak into
`packages/core`.

## User-facing behavior

- Users see provider errors as structured run failures.
- Valid provider tool calls result in tool execution attempts.
- Unsupported provider tool-call variants fail safely and do not execute tools.
- Final answers remain grounded in inspected paths.

## Internal design

Provider adapters convert SDK responses into:

```ts
export type ProviderResponse =
  | { type: "tool_call"; calls: ToolCall[] }
  | { type: "final"; content: string };
```

The internal tool call shape remains:

```ts
export interface ToolCall {
  id: string;
  name: string;
  input: JsonObject;
}
```

The core loop must not inspect SDK fields such as OpenAI `tool_calls`,
`function`, or provider-specific content parts.

## APIs / contracts

Provider adapter responsibilities:

- accept normalized agent messages and tool specs;
- call the provider SDK;
- parse supported provider tool-call variants;
- convert arguments to `JsonObject`;
- return internal `ProviderResponse`;
- convert provider failures to structured provider errors.

Core responsibilities:

- build provider-neutral messages;
- pass provider-neutral tool specs;
- process only internal `ProviderResponse`;
- leave SDK-specific parsing to providers.

## Data/state model

Provider normalization must preserve:

- provider call id;
- tool name;
- parsed JSON object input;
- final content;
- provider error kind and message.

Provider-specific raw response objects must not be stored in run state.

## Error handling

| Case                          | Required behavior                                                  |
| ----------------------------- | ------------------------------------------------------------------ |
| Malformed tool arguments      | Normalize to empty object only if tested, otherwise provider error |
| Unsupported tool-call variant | Return provider error or explicit skipped result                   |
| Missing tool name             | Return provider error                                              |
| Empty final response          | Return final with empty string only if documented                  |
| SDK request failure           | Return `provider_error`                                            |

## Permission/security considerations

- Normalization does not validate tool safety.
- Normalized calls still pass through strict tool validation.
- Provider output cannot bypass permission gates.
- Raw provider payloads must not be written to trace if they may contain
  secrets.

## Testing plan

Required tests:

- OpenAI function tool call maps to internal `ToolCall`;
- non-object argument payload becomes structured error or tested fallback;
- unsupported tool-call variant fails safely;
- final message maps to internal final response;
- provider errors map to `provider_error`;
- `packages/core` imports no provider SDK types.

## Documentation impact

Update these documents when implementation is complete:

- `docs/architecture/v0.1-minimal-coding-agent.md`
- `docs/agent/tool-protocol.md`
- `docs/engineering/testing-strategy.md`
- `docs/adr/0004-provider-abstraction.md`, only if the decision changes

## Acceptance criteria

This spec is accepted when:

- F-05 has direct test coverage;
- provider adapter tests cover success and failure paths;
- core package boundary checks remain clean;
- `bun run quality` passes.

## Non-goals

- full Anthropic implementation;
- streaming tool-call support;
- MCP tool protocol;
- provider-specific behavior in core;
- provider fallback or routing.

## Rollout plan

1. Add adapter normalization tests with SDK-shaped fixtures.
2. Ensure OpenAI function tool calls map to internal `ToolCall`.
3. Define unsupported variant behavior.
4. Add provider error mapping tests.
5. Run package-boundary checks and quality gates.
