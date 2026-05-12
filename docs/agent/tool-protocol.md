# Tool protocol 说明

## 接口

```ts
export type PermissionDecision = "allow" | "ask" | "deny";

export interface ToolPreview {
  title: string;
  summary: JsonObject;
  body?: string;
  truncated?: boolean;
}

export interface ToolDefinition<TInput = unknown> extends ToolSpec {
  name: string;
  description: string;
  inputJsonSchema: JsonObject;
  defaultPermission: PermissionDecision;
  requiresPermission?: boolean;
  inputSchema: z.ZodType<TInput>;
  evaluatePolicy?(
    input: TInput,
    context: ToolExecutionContext
  ): Promise<ToolPreview | void> | ToolPreview | void;
  execute(input: TInput, context: ToolExecutionContext): Promise<JsonValue> | JsonValue;
  buildResultMetadata?(output: JsonValue): JsonObject | undefined;
}

export interface ToolRegistry {
  prepare(call: ToolCall, context: ToolExecutionContext): Promise<ToolPreflightResult>;
  execute(call: ToolCall, context: ToolExecutionContext): Promise<ToolExecutionResult>;
}

export interface ToolExecutionResult {
  callId: string;
  toolName: string;
  ok: boolean;
  output?: JsonValue;
  error?: AgentError;
  metadata?: JsonObject;
}
```

## v0.2 工具

| Tool          | Permission | 用途                    |
| ------------- | ---------- | ----------------------- |
| `list_files`  | allow      | 列出安全 repo 文件      |
| `read_file`   | allow      | 读取安全文本文件内容    |
| `search_repo` | allow      | 在仓库文本中搜索        |
| `git_status`  | allow      | 检查 working tree 状态  |
| `apply_patch` | ask        | 预检并应用 unified diff |
| `run_command` | ask        | 执行受限只读命令        |

`run_command` 接受 `maxOutputBytes`，用于降低某次 approved call 的 command output cap。默认 cap 是 20,000 bytes。

`apply_patch` 接受 bounded unified diff，运行 deterministic preflight，并在 permission requested 前返回 `ToolPreview`。它的 execution path 不得 stage、commit、push 或 broaden `run_command`。

## 规则

- Tool names 使用 `verb_object`。
- Inputs 和 outputs 均经过 schema validation。
- Tool input schemas 拒绝 unknown fields。
- Outputs 结构化且有边界。
- Errors 结构化且 actionable。
- Permission 在 execution 前检查。
- Permissioned tools 在 permission prompt 前完成 preflight，因此 approval 不能覆盖 deterministic command 或 path policy。
- Tool output 包含 truncation metadata。
- Patch previews 由 `packages/tools` 生成，通过 `PreparedToolCall.preview` 传递，并由 CLI 渲染；CLI 不解析 raw patch input。
- Patch result metadata 有边界，可在 `tool.completed` trace events 上发出。

## 严格校验要求

Model-generated tool input 是不可信外部输入。

对 v0.1，Zod schema 与 exported JSON schema 必须一致：

```txt
Zod: unknown keys rejected
JSON schema: additionalProperties: false
```

Validation failures 必须返回 `tool_validation_error`，且不得进入 path、command、permission 或 execution logic。

Permission request 和 decision events 作为 `permission.requested` 和 `permission.decided` JSONL trace events 发出。

对于 patch requests，`permission.requested` 记录 preview metadata 和 omitted-input marker，而不是完整 raw patch。完整 diff 只存在于 active approval prompt 使用的 in-memory `PermissionRequest` 中。

## Patch tool 策略

`apply_patch` 在 approval 前拒绝任何 deterministic policy failure：

- invalid patch syntax；
- path traversal 或 symlink escape；
- secret-looking paths，例如 `.env`、`.pem`、`.key` 或 private key names；
- binary、mode、symlink、rename 或 copy patches；
- patch size above 200,000 bytes；
- touched files 超过 20 个；
- dirty touched files；
- non-applicable hunks。

批准后执行前，registry 会再次运行同一组 policy 和 applicability checks，然后 `apply_patch` 才会写入工作区。写入使用结构化 argv 调用 `git apply`，不通过 `run_command` 开放任意 shell 写命令。

## 实现阻塞项

在 registry 有以下测试前，不要实现 new tools：

- unknown tool name；
- missing required field；
- invalid field type；
- extra field rejection；
- structured validation error shape 已覆盖。
