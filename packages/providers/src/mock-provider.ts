import type {
  AgentMessage,
  JsonObject,
  ProviderClient,
  ProviderGenerateRequest,
  ProviderResponse,
  ToolExecutionResult
} from "@code-agent-harness/core";

export class MockProvider implements ProviderClient {
  readonly name = "mock";

  generate(request: ProviderGenerateRequest): Promise<ProviderResponse> {
    // What: mock provider 用固定两步模拟真实 agent inspection。Why: smoke 和
    // agent-loop tests 需要 deterministic provider，不依赖外部 API。How: 先请求
    // list_files，再根据结果读一个文件，最后返回 grounded final answer。
    const toolMessages = request.messages.filter((message) => message.role === "tool");

    if (!hasToolResult(toolMessages, "list_files")) {
      return Promise.resolve({
        type: "tool_call",
        calls: [
          {
            id: `${request.runId}-list-files`,
            name: "list_files",
            input: {
              path: ".",
              maxResults: 40
            }
          }
        ]
      });
    }

    if (!hasToolResult(toolMessages, "read_file")) {
      return Promise.resolve({
        type: "tool_call",
        calls: [
          {
            id: `${request.runId}-read-package`,
            name: "read_file",
            input: {
              path: chooseFileToRead(toolMessages),
              maxBytes: 12_000
            }
          }
        ]
      });
    }

    return Promise.resolve({
      type: "final",
      content: [
        "Inspected the repository with list_files and read_file.",
        "The fixture exposes a TypeScript package entry point and package metadata;",
        "cited paths: package.json, src/index.ts."
      ].join(" ")
    });
  }
}

export function createMockProvider(): ProviderClient {
  return new MockProvider();
}

function hasToolResult(messages: AgentMessage[], toolName: string): boolean {
  return messages.some((message) => parseToolResult(message)?.toolName === toolName);
}

function chooseFileToRead(messages: AgentMessage[]): string {
  // What: 从 list_files 的 tool result 中选择下一个要读的文件。Why: mock 也要
  // 模拟“先观察再行动”的 agent loop。How: 优先 package.json，否则读第一个文件，
  // fallback 到 README.md。
  const listResult = messages
    .map((message) => parseToolResult(message))
    .find((result) => result?.toolName === "list_files");

  const output = listResult?.output;
  if (isJsonObject(output) && Array.isArray(output.files)) {
    const files = output.files.filter(
      (file): file is string => typeof file === "string"
    );
    return files.includes("package.json") ? "package.json" : (files[0] ?? "README.md");
  }

  return "README.md";
}

function parseToolResult(message: AgentMessage): ToolExecutionResult | undefined {
  // What: 解析 core append 的 tool message。Why: mock provider 不应依赖内部状态，
  // 只通过消息历史决定下一步。How: JSON parse 成功且包含 toolName 时视为 tool result。
  try {
    const parsed = JSON.parse(message.content) as unknown;
    if (isJsonObject(parsed) && typeof parsed.toolName === "string") {
      return parsed as unknown as ToolExecutionResult;
    }
  } catch {
    return undefined;
  }

  return undefined;
}

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
