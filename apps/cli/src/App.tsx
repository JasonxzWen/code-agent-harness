import path from "node:path";
import {
  createJsonlEventLogger,
  redactJson,
  runAgentTask
} from "@code-agent-harness/core";
import type {
  JsonObject,
  PermissionDecision,
  PermissionGate,
  PermissionRequest,
  TraceEvent
} from "@code-agent-harness/core";
import {
  createMockProvider,
  createOpenAIProviderFromEnv
} from "@code-agent-harness/providers";
import { createDefaultToolRegistry } from "@code-agent-harness/tools";
import { Box, Text, useApp, useInput } from "ink";
import React, { useEffect, useMemo, useRef, useState } from "react";

export interface AppProps {
  repoRoot: string;
  initialTask?: string;
  live?: boolean;
}

export function App({
  repoRoot,
  initialTask,
  live = false
}: AppProps): React.ReactElement {
  const { exit } = useApp();
  const [draft, setDraft] = useState(initialTask ?? "");
  const [task, setTask] = useState<string | undefined>(initialTask);
  const [events, setEvents] = useState<TraceEvent[]>([]);
  const [pendingPermission, setPendingPermission] = useState<PermissionRequest>();
  const [finalAnswer, setFinalAnswer] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();
  const permissionResolver = useRef<
    ((decision: PermissionDecision) => void) | undefined
  >(undefined);
  const tools = useMemo(() => createDefaultToolRegistry(), []);
  const permissionGate = useMemo<PermissionGate>(
    () => ({
      check(request) {
        setPendingPermission(request);
        return new Promise((resolve) => {
          permissionResolver.current = (decision) => {
            permissionResolver.current = undefined;
            setPendingPermission(undefined);
            resolve(decision);
          };
        });
      }
    }),
    []
  );

  useInput((input, key) => {
    if (pendingPermission !== undefined) {
      if (input.toLowerCase() === "y" || input.toLowerCase() === "a") {
        permissionResolver.current?.("allow");
        return;
      }

      if (input.toLowerCase() === "n" || input.toLowerCase() === "d" || key.escape) {
        permissionResolver.current?.("deny");
        return;
      }
    }

    if (task !== undefined) {
      return;
    }

    if (key.return) {
      const trimmed = draft.trim();
      if (trimmed.length > 0) {
        setTask(trimmed);
      }
      return;
    }

    if (key.backspace || key.delete) {
      setDraft((current) => current.slice(0, -1));
      return;
    }

    if (!key.ctrl && !key.meta && input.length > 0) {
      setDraft((current) => `${current}${input}`);
    }
  });

  useEffect(() => {
    if (task === undefined) {
      return;
    }

    const provider = live ? createOpenAIProviderFromEnv() : createMockProvider();
    const tracePath = path.join(
      repoRoot,
      ".agent-harness",
      "traces",
      `cli-${Date.now().toString()}.jsonl`
    );
    const logger = createJsonlEventLogger(tracePath);

    void runAgentTask({
      task,
      repoRoot,
      provider,
      tools,
      logger,
      permissionGate,
      onEvent: (event) => {
        setEvents((current) => [...current, event].slice(-8));
      }
    }).then((state) => {
      if (state.status === "completed") {
        setFinalAnswer(state.finalAnswer ?? "");
      } else {
        setError(state.error?.message ?? "Run failed");
      }
      exit();
    });
  }, [exit, live, permissionGate, repoRoot, task, tools]);

  if (task === undefined) {
    return (
      <Box flexDirection="column">
        <Text color="cyan">agent-harness</Text>
        <Box>
          <Text>Task: </Text>
          <Text>{draft}</Text>
          <Text inverse> </Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Text color="cyan">agent-harness</Text>
      <Text>Repo: {repoRoot}</Text>
      <Text>Task: {task}</Text>
      {events.map((event) => (
        <Text key={`${event.timestamp}-${event.type}`}>
          {event.type} {JSON.stringify(event.data)}
        </Text>
      ))}
      {pendingPermission !== undefined ? (
        <Box flexDirection="column">
          <Text color="yellow">
            Permission: {pendingPermission.toolName}{" "}
            {summarizeJson(pendingPermission.input)}
          </Text>
          <Text>Approve? y/N</Text>
        </Box>
      ) : null}
      {finalAnswer !== undefined ? <Text color="green">{finalAnswer}</Text> : null}
      {error !== undefined ? <Text color="red">{error}</Text> : null}
    </Box>
  );
}

function summarizeJson(input: JsonObject): string {
  const serialized = JSON.stringify(redactJson(input));
  if (serialized.length <= 120) {
    return serialized;
  }

  return `${serialized.slice(0, 117)}...`;
}
