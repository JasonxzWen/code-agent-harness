# 规格：Permission Gate and Strict Tool Validation

## 范围 classification

`v0.1 blocker`

本 spec 只用于 documentation 和 implementation planning。除非明确请求 implementation，否则它不授权 coding。

## 问题

v0.1 contract 要求 validated tool calls、read-only command safety，以及 restricted command execution 前的 permission prompt。implementation 必须在代码中强制这些保证，而不能依赖 model behavior。

## 用户可见行为

- Read-only tools 无需 prompt 即可运行。
- Restricted command request 会暂停 run，并询问用户 approve 或 deny。
- Denied commands 会产生 structured tool result 和 trace event。
- Invalid tool input 会产生 structured validation error。
- Final answers 不得声称 denied 或 invalid tools 已执行。

## 内部设计

Agent loop 必须按以下顺序评估每个 provider tool call：

```txt
provider tool call
→ normalize to internal ToolCall
→ validate input with strict Zod schema
→ evaluate deterministic tool policy
→ evaluate permission gate
→ execute only if allowed
→ append structured result
→ write trace event
```

Permission gate 属于 `packages/core`，作为 provider-agnostic contract。CLI 可以提供 render prompts 的 implementation，但 `packages/core` 不得 import Ink。

`packages/tools` 拥有 tool schemas、path policy、command policy 和 execution。它不得知道 providers 或 TUI rendering。

## APIs / contracts 契约

Proposed core contract：

```ts
export type PermissionDecision = "allow" | "ask" | "deny";

export interface PermissionRequest {
  runId: string;
  toolName: string;
  input: JsonObject;
  reason?: string;
}

export interface PermissionGate {
  check(request: PermissionRequest): Promise<PermissionDecision>;
}
```

Tool definitions 必须声明 default permission：

```ts
defaultPermission: PermissionDecision;
```

Runtime validation requirement：

```txt
Zod schema rejects unknown keys.
JSON schema declares additionalProperties: false.
Validation failure returns tool_validation_error.
```

## 数据 / 状态模型

Permission-related run state 必须包含：

- pending permission request；
- approved 或 denied decision；
- tool call id；
- denied calls 的 structured result；
- request、decision 和 completion 的 trace events。

v0.1 中任何 permission state 都不得跨 process runs 持久化。

## 错误处理

| Case                     | Required error kind        |
| ------------------------ | -------------------------- |
| Unknown tool             | `tool_validation_error`    |
| Invalid schema input     | `tool_validation_error`    |
| Extra schema input       | `tool_validation_error`    |
| Denied permission        | `permission_denied`        |
| Path policy violation    | `path_policy_violation`    |
| Secret path violation    | `secret_policy_violation`  |
| Command policy violation | `command_policy_violation` |
| Tool execution failure   | `tool_execution_error`     |

## Permission / security 考量

- Permission 在 schema validation 之后、execution 之前评估。
- Permission approval 不能覆盖 deterministic safety policy。
- Shell strings 仍然 forbidden。
- Destructive commands 仍然 forbidden。
- File editing、patch application 和 write commands 仍 out of scope。
- Denied tool call 必须在 trace output 中可见。

## 测试计划

Implementation 被视为完成前的 required tests：

- strict schema 拒绝 unknown input fields；
- unknown tool 返回 `tool_validation_error`；
- invalid args 返回 `tool_validation_error`；
- read-only tools 以 `allow` 通过；
- `run_command` creates an `ask` permission request；
- approved read-only command 会执行；
- denied command 不执行；
- destructive command 即使 permission would allow 也会 denied；
- shell-token command is denied；
- denied command result 会 append 到 run context；
- permission events 会写入 JSONL trace。

## 文档影响

Implementation 完成后更新这些文档：

- `docs/agent/permission-system.md`
- `docs/agent/tool-protocol.md`
- `docs/architecture/v0.1-minimal-coding-agent.md`
- `docs/engineering/testing-strategy.md`
- `docs/releases/v0.1.0-contract.md`，仅当 public contract 改变时

## 验收标准

满足以下条件时，本 spec 被 accepted：

- 上述 test plan 已体现在 tests 中；
- `bun run quality` passes；
- 没有引入 v0.2+ feature；
- release checklist 将 F-06、F-11、S-05、S-06 和 S-08 标记为 satisfied。

## 非目标

- command write support；
- patch application；
- persistent permission memory；
- background approval；
- MCP permission integration；
- sandbox runtime；
- core 中的 provider-specific permission behavior。

## Rollout 计划

1. 实现 strict schemas 和 registry validation tests。
2. 在 core 中添加 provider-agnostic `PermissionGate` contract。
3. 添加 CLI permission prompt adapter，且不把 execution 移入 CLI。
4. 添加 permission request 和 decision trace events。
5. 运行 full quality gates。
6. 用 evidence 更新 release readiness checklist。
