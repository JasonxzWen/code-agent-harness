# Permission System

## Permission modes

```ts
export type PermissionDecision = "allow" | "ask" | "deny";

export interface PermissionRequest {
  runId: string;
  callId: string;
  toolName: string;
  input: JsonObject;
  reason?: string;
}

export interface PermissionGate {
  check(request: PermissionRequest): Promise<PermissionDecision>;
}
```

## v0.1 defaults

```json
{
  "permissions": {
    "list_files": "allow",
    "read_file": "allow",
    "search_repo": "allow",
    "git_status": "allow",
    "run_command": "ask"
  }
}
```

## Runtime contract

Permission handling is enforced by `packages/core` before permissioned tool
execution. The CLI supplies a `PermissionGate` adapter for interactive
approve/deny input, but tool execution remains in `packages/tools`.

Every tool call must pass through this sequence before execution:

```txt
strict schema validation
→ deterministic safety policy
→ permission gate
→ execution only when allowed
```

Approval from the permission gate cannot override deterministic safety policy.
For example, destructive commands remain denied even if a caller attempts to
approve them.

## Path safety

Required controls:

- canonical path must stay inside repo root;
- symlink targets outside repo are denied;
- ignored paths are denied;
- secret-looking paths are denied;
- binary reads are denied;
- large output is truncated.

## Command safety

Use argv arrays, not shell strings.

Allowed shape:

```json
{
  "command": ["git", "status", "--short"],
  "cwd": ".",
  "timeoutMs": 5000
}
```

Forbidden:

```json
{
  "command": ["git", "status", "&&", "rm", "-rf", "dist"]
}
```

Command policy must reject:

- shell control tokens;
- destructive commands;
- write-oriented git commands;
- commands outside the v0.1 allowlist;
- commands with unbounded output or timeout behavior.

## v0.1 command allowlist

| Command | Allowed args                                    |
| ------- | ----------------------------------------------- |
| `git`   | `status`, `diff --stat`, `log --oneline -n <N>` |
| `pwd`   | none                                            |
| `bun`   | `--version`                                     |
| `node`  | `--version`                                     |

## Trace requirements

Permission-sensitive runs must write JSONL events for:

- `permission.requested`;
- `permission.decided`;
- `tool.completed` with success or structured error status.

Trace events must not include secrets, API keys, or private file contents.
