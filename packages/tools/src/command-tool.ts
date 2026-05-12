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

const RunCommandInputSchema = z
  .object({
    command: z.array(z.string().min(1)).min(1),
    cwd: z.string().default("."),
    timeoutMs: z.number().int().min(100).max(10_000).default(5_000),
    maxOutputBytes: z.number().int().min(1).max(100_000).default(20_000)
  })
  .strict();

const SHELL_TOKENS = new Set(["&&", "||", "|", ";", ">", ">>", "<"]);

export const runCommandTool: ToolDefinition<z.infer<typeof RunCommandInputSchema>> = {
  name: "run_command",
  description:
    "Run a bounded command by argv after permission approval. " +
    "Only explicit v0.1 read-only allowlist commands are accepted.",
  defaultPermission: "ask",
  inputSchema: RunCommandInputSchema,
  inputJsonSchema: objectJsonSchema(
    {
      command: stringArraySchema,
      cwd: stringSchema,
      timeoutMs: integerSchema,
      maxOutputBytes: integerSchema
    },
    ["command"]
  ),
  evaluatePolicy(input, context) {
    // What: permission prompt 前先跑 command policy。Why: 用户批准不能把危险命令
    // 变安全。How: 只允许 read-only allowlist，并确认 cwd 仍在 repo 内。
    assertCommandAllowed(input.command);
    return resolveSafePath(context.repoRoot, input.cwd).then(() => undefined);
  },
  async execute(input, context) {
    // What: 执行 approved read-only command 并限制输出。Why: command output 可能
    // 很大，且 shell token 不能进入执行层。How: shell=false、argv 执行、timeout 和
    // maxOutputBytes 同时生效。
    assertCommandAllowed(input.command);
    const cwd = await resolveSafePath(context.repoRoot, input.cwd);
    const file = input.command[0];
    if (file === undefined) {
      throw new ToolPolicyError(
        createAgentError("command_policy_violation", "Command cannot be empty")
      );
    }
    const args = input.command.slice(1);
    const execaOptions = {
      all: true,
      cwd,
      reject: false,
      shell: false,
      timeout: input.timeoutMs
    };
    const result =
      context.signal === undefined
        ? await execa(file, args, execaOptions)
        : await execa(file, args, {
            ...execaOptions,
            cancelSignal: context.signal
          });
    const combinedOutput = result.all ?? "";
    const combinedOutputBuffer = Buffer.from(combinedOutput, "utf8");
    const outputBuffer = combinedOutputBuffer.subarray(0, input.maxOutputBytes);

    return {
      command: input.command,
      exitCode: result.exitCode ?? null,
      output: outputBuffer.toString("utf8"),
      truncated: combinedOutputBuffer.byteLength > input.maxOutputBytes,
      maxOutputBytes: input.maxOutputBytes,
      outputBytes: outputBuffer.byteLength,
      sizeBytes: combinedOutputBuffer.byteLength
    };
  }
};

function assertCommandAllowed(command: string[]): void {
  // What: command allowlist 是 run_command 的 deterministic safety boundary。
  // Why: v0.1/v0.2 不允许模型通过 shell 写文件或执行破坏性命令。How: 先拒绝
  // shell control tokens，再只接受少量 read-only 命令形状。
  const executable = command[0]?.toLowerCase();
  if (executable === undefined) {
    throw new ToolPolicyError(
      createAgentError("command_policy_violation", "Command cannot be empty")
    );
  }

  if (command.some((part) => containsShellToken(part))) {
    throw new ToolPolicyError(
      createAgentError("command_policy_violation", "Shell control tokens are denied", {
        command
      })
    );
  }

  if (isAllowedCommand(command)) {
    return;
  }

  throw new ToolPolicyError(
    createAgentError(
      "command_policy_violation",
      "Command is outside the v0.1 read-only allowlist",
      {
        command
      }
    )
  );
}

function isAllowedCommand(command: string[]): boolean {
  const executable = command[0]?.toLowerCase();
  if (executable === undefined) {
    return false;
  }

  if (executable === "pwd") {
    return command.length === 1;
  }

  if (executable === "bun" || executable === "node") {
    return command.length === 2 && command[1] === "--version";
  }

  if (executable !== "git") {
    return false;
  }

  const subcommand = command[1]?.toLowerCase();
  if (subcommand === "status") {
    return command
      .slice(2)
      .every((arg) => ["--short", "--porcelain", "--branch"].includes(arg));
  }

  if (subcommand === "diff") {
    return command.length === 3 && command[2] === "--stat";
  }

  if (subcommand === "log") {
    return (
      command.length === 5 &&
      command[2] === "--oneline" &&
      command[3] === "-n" &&
      isPositiveBoundedInteger(command[4])
    );
  }

  return false;
}

function isPositiveBoundedInteger(value: string | undefined): boolean {
  if (value === undefined || !/^[1-9]\d*$/.test(value)) {
    return false;
  }

  return Number(value) <= 100;
}

function containsShellToken(part: string): boolean {
  if (SHELL_TOKENS.has(part)) {
    return true;
  }

  for (const token of SHELL_TOKENS) {
    if (part.includes(token)) {
      return true;
    }
  }

  return false;
}
