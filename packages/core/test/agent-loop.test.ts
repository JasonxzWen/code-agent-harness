import { describe, expect, test } from "bun:test";
import { runAgentTask } from "../src/agent-loop";
import type {
  ProviderClient,
  ProviderGenerateRequest,
  ProviderResponse,
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
          inputJsonSchema: {
            type: "object"
          }
        }
      ],
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
