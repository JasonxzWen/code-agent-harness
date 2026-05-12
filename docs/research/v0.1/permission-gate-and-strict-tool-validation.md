# 调研：Permission Gate and Strict Tool Validation

## 问题

v0.1 release contract 要求 restricted commands 暂停等待 approval，并要求 invalid tool arguments 产生 structured errors。当前 public docs 已定义这些目标，但剩余 implementation work 在 coding 前需要更紧的 contract。

## Release 相关性

Scope classification：`v0.1 blocker`。

本工作直接映射到：

- F-06 tool validation；
- F-11 permission prompt；
- S-05 shell string denial；
- S-06 destructive command denial；
- S-08 no write-capable tools。

## 来源 reviewed

- `docs/releases/v0.1.0-contract.md`
- `docs/architecture/v0.1-minimal-coding-agent.md`
- `docs/agent/permission-system.md`
- `docs/agent/tool-protocol.md`
- `docs/engineering/testing-strategy.md`
- `docs/adr/0003-tool-protocol-with-zod.md`
- `docs/adr/0006-permission-gate-before-command-execution.md`

## 行业实践

Comparable agent systems 会分离 tool schema validation、permission decisions 和 execution。对 v0.1 来说，关键模式不是 broad automation，而是一个不能被 provider output 绕过的小型 deterministic gate。

## 备选方案

| Option                                | Description                                  | Decision                                     |
| ------------------------------------- | -------------------------------------------- | -------------------------------------------- |
| Deny all restricted commands          | 实际上禁用 `run_command`                     | 拒绝：不满足 F-11                            |
| Prompt-only permission                | 要求 model 在 commands 前主动询问            | 拒绝：prompt-only safety 是 project non-goal |
| Tool registry owns permission         | Registry 只基于 context 决定 deny 或 execute | 拒绝：缺少 CLI pause 和 approval flow        |
| Core permission gate before execution | Agent loop 在 restricted tools 前询问 gate   | 采用                                         |

## 取舍矩阵

| Criterion            | Deny all | Prompt-only | Core gate |
| -------------------- | -------- | ----------- | --------- |
| Meets F-11           | 否       | 否          | 是        |
| Deterministic safety | 高       | 低          | 高        |
| CLI complexity       | 低       | 低          | 中        |
| Testability          | 中       | 低          | 高        |
| v0.1 scope fit       | 部分     | 否          | 是        |

## 项目特定约束

- v0.1 保持 read-only。
- 不得引入 write-capable tool。
- `packages/core` 不能 import Ink 或 provider SDK types。
- `packages/tools` 不能 call providers。
- CLI 可以 render permission prompts，但 tool execution 留在 CLI 之外。
- Model-generated tool input 必须先用 Zod validation，再进入 policy 或 execution。

## 建议

在 core 中定义 `PermissionGate` contract，并让每个 tool call 在 execution 前通过它。Read-only tools 默认 `allow`；`run_command` 默认 `ask`；dangerous 或 out-of-scope operations 返回 `deny`。

收紧 tool input schemas，使 unknown fields 被 reject，而不是 silently stripped。runtime JSON schema 和 Zod schema 必须对 `additionalProperties: false` 保持一致。

## 影响的验收标准

- F-06：invalid 或 extra tool args 返回 `tool_validation_error`。
- F-11：restricted commands pause for approval 已覆盖。
- S-05：shell strings 在 execution 前被 denied。
- S-06：destructive commands 在 execution 前被 denied。
- S-08：不存在 write-capable tool。

## 开放问题

- v0.1 应只支持 one-time approval，还是 per-run approval caching？
- Declined commands 应 append 到 model context 作为 tool results，还是只作为 run events？
- Live provider runs 是否允许请求 `run_command`，还是第一版只通过 deterministic tests 触达 command approval？
