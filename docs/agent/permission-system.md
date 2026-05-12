# Permission System

## Permission Modes

```ts
export type PermissionDecision = "allow" | "ask" | "deny";

export interface ToolPreview {
  title: string;
  summary: JsonObject;
  body?: string;
  truncated?: boolean;
}

export interface PermissionRequest {
  runId: string;
  callId: string;
  toolName: string;
  input: JsonObject;
  reason?: string;
  preview?: ToolPreview;
}

export interface PermissionGate {
  check(request: PermissionRequest): Promise<PermissionDecision>;
}
```

## v0.2 Defaults

```json
{
  "permissions": {
    "list_files": "allow",
    "read_file": "allow",
    "search_repo": "allow",
    "git_status": "allow",
    "apply_patch": "ask",
    "run_command": "ask"
  }
}
```

## Runtime Contract

Permission handling 由 `packages/core` 在 permissioned tool execution 前强制执行。CLI 提供用于 interactive approve/deny input 的 `PermissionGate` adapter，但 tool execution 仍在 `packages/tools` 中。

每次 tool call 在 execution 前都必须经过以下 sequence：

```txt
strict schema validation
-> deterministic safety policy
-> permission preview
-> permission gate
-> revalidate deterministic safety policy
-> execution only when allowed
```

permission gate 的 approval 不能覆盖 deterministic safety policy。例如，即使 caller 尝试 approve，destructive commands 仍然 denied。

对于 `apply_patch`，permission request 包含由 tools package 生成的 `ToolPreview`。preview 包含 diff summary、touched files、risk markers、truncated diff body 和 truncation flag。permission trace 只记录 bounded preview metadata；不记录完整 raw patch。

如果用户在 prompt 等待期间 deny 或 abort，则不会发生写入。denial 时 agent 收到 structured `permission_denied` result；abort 时 run 进入 `aborted` state。

## Path Safety

必需 controls：

- canonical path 必须留在 repo root 内；
- 指向 repo 外的 symlink targets 被 denied；
- ignored paths 被 denied；
- secret-looking paths 被 denied；
- binary reads 被 denied；
- large output 被 truncated。

## Command Safety

使用 argv arrays，不使用 shell strings。

Allowed shape：

```json
{
  "command": ["git", "status", "--short"],
  "cwd": ".",
  "timeoutMs": 5000
}
```

Forbidden：

```json
{
  "command": ["git", "status", "&&", "rm", "-rf", "dist"]
}
```

Command policy 必须 reject：

- shell control tokens；
- destructive commands；
- write-oriented git commands；
- v0.1 read-only allowlist 外的 commands；
- output 或 timeout behavior 无边界的 commands。

## Patch Safety

`apply_patch` 是 v0.2 唯一新增写入能力。它默认 `ask`，并且批准不能覆盖下列 deterministic deny：

- patch path escapes repo root；
- patch path 通过 symlink escape 解析到外部；
- patch touches secret-looking paths，拒绝修改；
- patch 是 binary、mode-only、symlink、rename 或 copy metadata；
- patch 超过 size 或 file-count limits；
- touched files 已经 dirty；
- hunk 无法 clean apply。

批准后，`packages/tools` 会再次检查 touched-file 状态和 applicability，再使用结构化 `git apply` argv 写入工作区。该工具不 stage、commit、push，也不修改 `run_command` 的只读 allowlist。

## v0.1 Command Allowlist

| Command | Allowed args                                    |
| ------- | ----------------------------------------------- |
| `git`   | `status`, `diff --stat`, `log --oneline -n <N>` |
| `pwd`   | none                                            |
| `bun`   | `--version`                                     |
| `node`  | `--version`                                     |

## Trace Requirements

Permission-sensitive runs 必须写入以下 JSONL events：

- `permission.requested`；
- `permission.decided`；
- `tool.completed` with success or structured error status。

Trace events 不得包含 secrets、API keys、private file contents 或 full large diffs。Patch trace events 使用 preview summary 和 bounded result metadata。
