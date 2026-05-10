import { agentErrorToJson, createAgentError, errorFromUnknown } from "./errors";
import { createRunId } from "./run-id";
import type {
  AgentMessage,
  AgentRunState,
  EventLogger,
  JsonObject,
  ProviderClient,
  ToolRegistry,
  TraceEvent
} from "./types";

export interface RunAgentTaskInput {
  task: string;
  repoRoot: string;
  provider: ProviderClient;
  tools: ToolRegistry;
  maxSteps?: number;
  logger?: EventLogger;
  onEvent?: (event: TraceEvent) => void;
}

const SYSTEM_PROMPT = [
  "You are a read-only coding agent for v0.1.",
  "Inspect repositories through tools before answering.",
  "Cite inspected file paths in final answers.",
  "Do not claim to edit, patch, or persist memory."
].join(" ");

export async function runAgentTask(input: RunAgentTaskInput): Promise<AgentRunState> {
  const maxSteps = input.maxSteps ?? 8;
  const runId = createRunId();
  const messages: AgentMessage[] = [
    {
      role: "system",
      content: SYSTEM_PROMPT
    },
    {
      role: "user",
      content: input.task
    }
  ];
  const state: AgentRunState = {
    runId,
    status: "running",
    task: input.task,
    repoRoot: input.repoRoot,
    messages,
    toolResults: []
  };

  await emit(input, runId, "run.started", {
    task: input.task,
    repoRoot: input.repoRoot
  });

  try {
    for (let step = 0; step < maxSteps; step += 1) {
      const tools = input.tools.specs();
      await emit(input, runId, "provider.requested", {
        provider: input.provider.name,
        step,
        toolCount: tools.length
      });

      const response = await input.provider.generate({
        runId,
        step,
        messages: state.messages,
        tools
      });

      await emit(input, runId, "provider.completed", {
        provider: input.provider.name,
        step,
        responseType: response.type
      });

      if (response.type === "final") {
        state.status = "completed";
        state.finalAnswer = response.content;
        state.messages.push({
          role: "assistant",
          content: response.content
        });
        await emit(input, runId, "run.completed", {
          finalAnswer: response.content
        });
        return state;
      }

      for (const call of response.calls) {
        await emit(input, runId, "tool.started", {
          callId: call.id,
          toolName: call.name
        });

        const result = await input.tools.execute(call, {
          repoRoot: input.repoRoot
        });
        state.toolResults.push(result);
        state.messages.push({
          role: "tool",
          name: result.toolName,
          toolCallId: result.callId,
          content: JSON.stringify(result)
        });

        await emit(input, runId, "tool.completed", {
          callId: call.id,
          toolName: call.name,
          ok: result.ok
        });
      }
    }

    const error = createAgentError(
      "provider_error",
      `Provider did not produce a final response within ${maxSteps} steps`
    );
    state.status = "failed";
    state.error = error;
    await emit(input, runId, "run.failed", {
      error: agentErrorToJson(error)
    });
    return state;
  } catch (error) {
    const agentError = errorFromUnknown("internal_error", error);
    state.status = "failed";
    state.error = agentError;
    await emit(input, runId, "run.failed", {
      error: agentErrorToJson(agentError)
    });
    return state;
  }
}

async function emit(
  input: RunAgentTaskInput,
  runId: string,
  type: TraceEvent["type"],
  data: JsonObject
): Promise<void> {
  const event: TraceEvent = {
    runId,
    timestamp: new Date().toISOString(),
    type,
    data
  };
  input.onEvent?.(event);
  await input.logger?.write(event);
}
