import { describe, expect, test } from "bun:test";
import { runAgentTask } from "../src/agent-loop";
import type {
  ProviderClient,
  ProviderGenerateRequest,
  ProviderResponse,
  ToolPreflightResult,
  ToolCall,
  ToolExecutionResult,
  ToolRegistry
} from "../src/types";

describe("runAgentTask", () => {
  test("runs tool call to final response", async () => {
    const provider = new TwoStepProvider();
    const tools: ToolRegistry = {
      specs: () => [
        {
          name: "example",
          description: "example tool",
          defaultPermission: "allow",
          inputJsonSchema: {
            type: "object"
          }
        }
      ],
      prepare: (call: ToolCall): Promise<ToolPreflightResult> =>
        Promise.resolve({
          ok: true,
          prepared: {
            callId: call.id,
            toolName: call.name,
            input: call.input,
            defaultPermission: "allow"
          }
        }),
      execute: (call: ToolCall): Promise<ToolExecutionResult> =>
        Promise.resolve({
          callId: call.id,
          toolName: call.name,
          ok: true,
          output: {
            path: "package.json"
          }
        })
    };

    const state = await runAgentTask({
      task: "inspect",
      repoRoot: process.cwd(),
      provider,
      tools,
      maxSteps: 3
    });

    expect(state.status).toBe("completed");
    expect(state.toolResults).toHaveLength(1);
    expect(state.finalAnswer).toContain("package.json");
  });

  test("records permission request and decision events", async () => {
    const provider = new CommandProvider();
    const loggedEvents: string[] = [];
    const requests: string[] = [];
    const tools = createPermissionedTools(() =>
      Promise.resolve({
        callId: "call-1",
        toolName: "run_command",
        ok: true,
        output: {
          command: ["bun", "--version"]
        }
      })
    );

    const state = await runAgentTask({
      task: "inspect",
      repoRoot: process.cwd(),
      provider,
      tools,
      maxSteps: 3,
      logger: {
        write(event) {
          loggedEvents.push(event.type);
          return Promise.resolve();
        }
      },
      permissionGate: {
        check(request) {
          requests.push(request.toolName);
          return Promise.resolve("allow");
        }
      }
    });

    expect(state.status).toBe("completed");
    expect(requests).toEqual(["run_command"]);
    expect(loggedEvents).toContain("permission.requested");
    expect(loggedEvents).toContain("permission.decided");
    expect(state.toolResults[0]?.ok).toBe(true);
  });

  test("does not execute denied permissioned tools", async () => {
    let executed = false;
    const state = await runAgentTask({
      task: "inspect",
      repoRoot: process.cwd(),
      provider: new CommandProvider(),
      tools: createPermissionedTools(() => {
        executed = true;
        return Promise.resolve({
          callId: "call-1",
          toolName: "run_command",
          ok: true,
          output: {}
        });
      }),
      maxSteps: 2,
      permissionGate: {
        check() {
          return Promise.resolve("deny");
        }
      }
    });

    expect(executed).toBe(false);
    expect(state.toolResults[0]?.ok).toBe(false);
    expect(state.toolResults[0]?.error?.kind).toBe("permission_denied");
  });
});

class TwoStepProvider implements ProviderClient {
  readonly name = "two-step";

  generate(request: ProviderGenerateRequest): Promise<ProviderResponse> {
    if (request.step === 0) {
      return Promise.resolve({
        type: "tool_call",
        calls: [
          {
            id: "call-1",
            name: "example",
            input: {}
          }
        ]
      });
    }

    return Promise.resolve({
      type: "final",
      content: "Inspected package.json"
    });
  }
}

class CommandProvider implements ProviderClient {
  readonly name = "command-provider";

  generate(request: ProviderGenerateRequest): Promise<ProviderResponse> {
    if (request.step === 0) {
      return Promise.resolve({
        type: "tool_call",
        calls: [
          {
            id: "call-1",
            name: "run_command",
            input: {
              command: ["bun", "--version"]
            }
          }
        ]
      });
    }

    return Promise.resolve({
      type: "final",
      content: "Inspected command output"
    });
  }
}

function createPermissionedTools(
  execute: (call: ToolCall) => Promise<ToolExecutionResult>
): ToolRegistry {
  return {
    specs: () => [
      {
        name: "run_command",
        description: "command",
        defaultPermission: "ask",
        inputJsonSchema: {
          type: "object"
        }
      }
    ],
    prepare: (call: ToolCall): Promise<ToolPreflightResult> =>
      Promise.resolve({
        ok: true,
        prepared: {
          callId: call.id,
          toolName: call.name,
          input: call.input,
          defaultPermission: "ask"
        }
      }),
    execute
  };
}
