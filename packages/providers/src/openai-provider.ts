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
