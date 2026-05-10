import { describe, expect, test } from "bun:test";
import { createMockProvider } from "../src/mock-provider";

describe("MockProvider", () => {
  test("starts by requesting repository file listing", async () => {
    const provider = createMockProvider();
    const response = await provider.generate({
      runId: "run-test",
      step: 0,
      messages: [
        {
          role: "user",
          content: "inspect"
        }
      ],
      tools: []
    });

    expect(response.type).toBe("tool_call");
    if (response.type === "tool_call") {
      expect(response.calls[0]?.name).toBe("list_files");
    }
  });
});
