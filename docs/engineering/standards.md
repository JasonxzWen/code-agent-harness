# Engineering Standards

## TypeScript

Use strict TypeScript.

Required compiler posture:

```json
{
  "strict": true,
  "noUncheckedIndexedAccess": true,
  "exactOptionalPropertyTypes": true,
  "noImplicitOverride": true,
  "noFallthroughCasesInSwitch": true,
  "useUnknownInCatchVariables": true
}
```

## Package boundaries

| Package              | Responsibility                                    | Must not do                      |
| -------------------- | ------------------------------------------------- | -------------------------------- |
| `apps/cli`           | TUI and interaction                               | execute tools directly           |
| `packages/core`      | orchestration, state, config, permission, logging | import provider SDK types or Ink |
| `packages/tools`     | tools and safety policies                         | call model providers             |
| `packages/providers` | provider adapters and normalization               | execute tools                    |

## Naming

| Thing     | Convention            | Example                |
| --------- | --------------------- | ---------------------- |
| file      | kebab-case            | `agent-loop.ts`        |
| component | PascalCase            | `PermissionPrompt.tsx` |
| type      | PascalCase            | `AgentRunState`        |
| function  | camelCase             | `executeToolCall`      |
| schema    | PascalCase + `Schema` | `ToolCallSchema`       |
| event     | dot notation          | `tool.completed`       |
| tool      | snake_case            | `read_file`            |

## Errors

Runtime errors should map to:

```ts
export type AgentErrorKind =
  | "config_error"
  | "provider_error"
  | "tool_validation_error"
  | "tool_execution_error"
  | "permission_denied"
  | "path_policy_violation"
  | "secret_policy_violation"
  | "command_policy_violation"
  | "timeout"
  | "internal_error";
```

## Logging

- No random stdout logging in core packages.
- Core emits events.
- CLI renders state.
- Tool results are structured.
- Secrets are redacted.

## Runtime Contracts

- Treat model-generated tool input as untrusted external input.
- Reject unknown tool input fields at runtime.
- Validate before path policy, command policy, permission, or execution.
- Enforce safety in code; never rely on prompt-only safety.
- Permission approval cannot override deterministic deny rules.
- v0.1 tools must remain read-only.

## Commits

Use Conventional Commits:

```txt
feat(core): add agent loop
feat(tools): add read_file tool
fix(tools): block symlink escape
docs(adr): add read-only v0.1 decision
test(core): cover permission denied flow
ci: add quality gate
```
