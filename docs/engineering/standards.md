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

## Review Handoff Reports

When an agent pauses for human review after code or documentation changes, the
report must focus on reviewable change points instead of a flat file list.

Each review handoff must include:

- what changed;
- why it changed;
- how the implementation works;
- the exact file and line number for the primary implementation or evidence;
- why that location is important to review;
- any related test or documentation evidence when relevant.

Use a Feynman-style explanation as the default: explain the change in plain
language first, then connect it to the exact code path and tests. A reviewer who
has not held the whole diff in their head should still understand what changed,
why the design was chosen, and how to verify it.

Prefer short bullets or a table such as:

| What changed             | Why                                          | How                                    | File:line                              | Review focus                                              |
| ------------------------ | -------------------------------------------- | -------------------------------------- | -------------------------------------- | --------------------------------------------------------- |
| Added patch policy check | Prevent traversal from being normalized away | Reject `..` path segments before apply | `packages/tools/src/patch-tool.ts:446` | Confirm the policy boundary matches the release contract. |

Do not use a bare "files changed" list as the main review handoff.

## Runtime Contracts

- Treat model-generated tool input as untrusted external input.
- Reject unknown tool input fields at runtime.
- Validate before path policy, command policy, permission, or execution.
- Enforce safety in code; never rely on prompt-only safety.
- Permission approval cannot override deterministic deny rules.
- v0.1 tools must remain read-only.

## Build Contract

- `bun run build` must produce the local CLI bundle at `dist/agent-harness.js`.
- The build may externalize runtime dependencies, but it must bundle local CLI
  source and remain runnable with `bun dist/agent-harness.js ...` after
  `bun install`.
- Any change to CLI entrypoints, workspace package exports, runtime dependency
  loading, or TypeScript module resolution must keep `bun run build` passing.
- `bun run quality` and CI must include `bun run build` so build drift is caught
  before release.

## Release Documentation

- Every release note must follow
  `docs/engineering/release-documentation-standard.md`.
- Release notes must explain features, key logic, code definition locations,
  implementation rationale, industry comparison, quality evidence, known
  limitations, and next steps.
- Release notes must include at least one Mermaid diagram that shows the release
  flow, capability boundary, or module change.
- From `v0.2.0` onward, new release notes, release contracts, checklists,
  specs, research notes, and ADRs must use Chinese as the body language. Code
  identifiers, commands, package names, external project names, and source
  titles may remain in their original language.

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
