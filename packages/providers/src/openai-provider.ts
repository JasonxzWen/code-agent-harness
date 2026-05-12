import OpenAI from "openai";
import type {
  AgentMessage,
  JsonObject,
  ProviderClient,
  ProviderGenerateRequest,
  ProviderResponse
} from "@code-agent-harness/core";

export interface OpenAIProviderOptions {
  apiKey: string;
  model?: string;
}

export class OpenAIProvider implements ProviderClient {
  readonly name = "openai";
  readonly #client: OpenAI;
  readonly #model: string;

  constructor(options: OpenAIProviderOptions) {
    this.#client = new OpenAI({ apiKey: options.apiKey });
    this.#model = options.model ?? "gpt-4.1-mini";
  }

  async generate(request: ProviderGenerateRequest): Promise<ProviderResponse> {
    // What: OpenAI adapter 把 provider-neutral request 转成 Chat Completions
    // function tools。Why: `packages/core` 不能知道 OpenAI SDK shape。How:
    // adapter 负责消息和 tool schema 映射，再把 response 归一化成 ProviderResponse。
    const response = await this.#client.chat.completions.create(
      {
        model: this.#model,
        messages: request.messages.map(toChatMessage),
        tools: request.tools.map((tool) => ({
          type: "function",
          function: {
            name: tool.name,
            description: tool.description,
            parameters: tool.inputJsonSchema
          }
        }))
      },
      {
        signal: request.signal
      }
    );

    const message = response.choices[0]?.message;
    if (message?.tool_calls !== undefined && message.tool_calls.length > 0) {
      // What: 只接受 function tool calls。Why: core 的 ToolCall contract 只有
      // `{ id, name, input }`，unsupported provider variants 不能穿透到 core。
      // How: filter 后解析 JSON arguments，失败时回退为空对象，由 tool schema 再拒绝。
      const functionToolCalls = message.tool_calls.filter(isFunctionToolCall);
      return {
        type: "tool_call",
        calls: functionToolCalls.map((call) => ({
          id: call.id,
          name: call.function.name,
          input: parseToolArguments(call.function.arguments)
        }))
      };
    }

    return {
      type: "final",
      content: message?.content ?? ""
    };
  }
}

export function createOpenAIProviderFromEnv(model?: string): ProviderClient {
  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey === undefined || apiKey.length === 0) {
    throw new Error("OPENAI_API_KEY is required for the OpenAI provider");
  }

  return model === undefined
    ? new OpenAIProvider({ apiKey })
    : new OpenAIProvider({ apiKey, model });
}

function toChatMessage(
  message: AgentMessage
): OpenAI.Chat.Completions.ChatCompletionMessageParam {
  if (message.role === "tool") {
    // What: 当前限制下 tool result 暂映射为 user message。Why: core 不保存 SDK-shaped
    // assistant tool_call history，不能安全构造 provider-native tool_call_id continuity。
    // How: 文档记录该限制，后续 provider work 应在 adapter boundary 修复。
    return {
      role: "user",
      content: `Tool result from ${message.name ?? "tool"}:\n${message.content}`
    };
  }

  return {
    role: message.role,
    content: message.content
  };
}

function parseToolArguments(raw: string): JsonObject {
  // What: 将 provider 返回的 function arguments 解析为 JsonObject。Why: 模型
  // 可能返回 malformed JSON 或非对象值。How: parse 失败或不是对象时回退为空对象，
  // 让 registry 的 strict schema 产生可控错误。
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
      return parsed as JsonObject;
    }
  } catch {
    return {};
  }

  return {};
}

function isFunctionToolCall(
  call: OpenAI.Chat.Completions.ChatCompletionMessageToolCall
): call is OpenAI.Chat.Completions.ChatCompletionMessageFunctionToolCall {
  return call.type === "function";
}
