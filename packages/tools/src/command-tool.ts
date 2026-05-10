import { execa } from "execa";
import { z } from "zod";
import { createAgentError } from "@code-agent-harness/core";
import type { ToolDefinition } from "@code-agent-harness/core";
import {
  integerSchema,
  objectJsonSchema,
  stringArraySchema,
  stringSchema
} from "./json-schema";
import { resolveSafePath, ToolPolicyError } from "./policies";

const RunCommandInputSchema = z.object({
  command: z.array(z.string().min(1)).min(1),
  cwd: z.string().default("."),
  timeoutMs: z.number().int().min(100).max(10_000).default(5_000)
});

const DENIED_COMMANDS = new Set(["del", "erase", "rm", "rmdir"]);
const DENIED_GIT_SUBCOMMANDS = new Set(["clean", "checkout", "reset", "restore"]);
const SHELL_TOKENS = new Set(["&&", "||", "|", ";", ">", ">>", "<"]);

export const runCommandTool: ToolDefinition<z.infer<typeof RunCommandInputSchema>> = {
  name: "run_command",
  description:
    "Run a bounded command by argv after permission approval. " +
    "Shell strings and destructive commands are denied.",
  inputSchema: RunCommandInputSchema,
  inputJsonSchema: objectJsonSchema(
    {
      command: stringArraySchema,
      cwd: stringSchema,
      timeoutMs: integerSchema
    },
    ["command"]
  ),
  requiresPermission: true,
  async execute(input, context) {
    assertCommandAllowed(input.command);
    const cwd = await resolveSafePath(context.repoRoot, input.cwd);
    const file = input.command[0];
    if (file === undefined) {
      throw new ToolPolicyError(
        createAgentError("command_policy_violation", "Command cannot be empty")
      );
    }
    const args = input.command.slice(1);
    const result = await execa(file, args, {
      all: true,
      cwd,
      reject: false,
      shell: false,
      timeout: input.timeoutMs
    });
    const combinedOutput = result.all ?? "";
    const maxOutputBytes = 20_000;

    return {
      command: input.command,
      exitCode: result.exitCode ?? null,
      output: combinedOutput.slice(0, maxOutputBytes),
      truncated: combinedOutput.length > maxOutputBytes
    };
  }
};

function assertCommandAllowed(command: string[]): void {
  const executable = command[0]?.toLowerCase();
  if (executable === undefined) {
    throw new ToolPolicyError(
      createAgentError("command_policy_violation", "Command cannot be empty")
    );
  }

  if (command.some((part) => SHELL_TOKENS.has(part))) {
    throw new ToolPolicyError(
      createAgentError("command_policy_violation", "Shell control tokens are denied", {
        command
      })
    );
  }

  if (DENIED_COMMANDS.has(executable)) {
    throw new ToolPolicyError(
      createAgentError("command_policy_violation", "Destructive commands are denied", {
        command
      })
    );
  }

  if (
    executable === "git" &&
    command[1] !== undefined &&
    DENIED_GIT_SUBCOMMANDS.has(command[1].toLowerCase())
  ) {
    throw new ToolPolicyError(
      createAgentError(
        "command_policy_violation",
        "Destructive git commands are denied",
        {
          command
        }
      )
    );
  }
}
