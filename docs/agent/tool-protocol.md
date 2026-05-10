# Tool Protocol

## Interface

```ts
export type ToolPermissionMode = "allow" | "ask" | "deny";

export interface AgentTool<TInput, TOutput> {
  name: string;
  description: string;
  inputSchema: z.ZodType<TInput>;
  outputSchema: z.ZodType<TOutput>;
  defaultPermission: ToolPermissionMode;
  execute(input: TInput, context: ToolExecutionContext): Promise<ToolResult<TOutput>>;
}

export interface ToolResult<TOutput> {
  ok: boolean;
  output?: TOutput;
  error?: ToolError;
  metadata: {
    durationMs: number;
    truncated: boolean;
    outputChars: number;
  };
}
```

## v0.1 tools

| Tool          | Permission | Purpose                           |
| ------------- | ---------- | --------------------------------- |
| `list_files`  | allow      | list safe repo files              |
| `read_file`   | allow      | read safe text file content       |
| `search_repo` | allow      | search text in repository         |
| `git_status`  | allow      | inspect working tree state        |
| `run_command` | ask        | run restricted read-only commands |

## Rules

- Tool names use `verb_object`.
- Inputs and outputs are schema-validated.
- Tool input schemas reject unknown fields.
- Outputs are structured and bounded.
- Errors are structured and actionable.
- Permission is checked before execution.
- Tool output includes truncation metadata.

## Strict validation requirement

Model-generated tool input is untrusted external input.

For v0.1, the Zod schema and exported JSON schema must agree:

```txt
Zod: unknown keys rejected
JSON schema: additionalProperties: false
```

Validation failures must return `tool_validation_error` and must not reach path,
command, permission, or execution logic.

## Implementation blocker

Do not implement new tools until the registry has tests for:

- unknown tool name;
- missing required field;
- invalid field type;
- extra field rejection;
- structured validation error shape.
