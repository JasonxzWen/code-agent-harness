# Permission System

## Permission modes

```ts
export type PermissionDecision = "allow" | "ask" | "deny";
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

## Pre-implementation contract

Permission handling is a v0.1 release blocker, not a later enhancement.

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

Use command + args, not shell strings.

Allowed shape:

```json
{
  "command": "git",
  "args": ["status", "--short"],
  "reason": "Inspect working tree state."
}
```

Forbidden:

```json
{
  "command": "git status && rm -rf dist"
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

- permission request created;
- permission decision received;
- tool execution skipped or completed.

Trace events must not include secrets, API keys, or private file contents.
