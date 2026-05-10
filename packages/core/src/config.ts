import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { z } from "zod";

export const AgentHarnessConfigSchema = z.object({
  repoRoot: z.string().min(1).default("."),
  provider: z.enum(["mock", "openai", "anthropic"]).default("mock"),
  model: z.string().min(1).default("mock-local"),
  maxSteps: z.number().int().min(1).max(20).default(8),
  traceDir: z.string().min(1).default(".agent-harness/traces")
});

export type AgentHarnessConfig = z.infer<typeof AgentHarnessConfigSchema>;

export async function loadConfig(
  configPath = ".agent-harness.json"
): Promise<AgentHarnessConfig> {
  try {
    const raw = await readFile(resolve(configPath), "utf8");
    return AgentHarnessConfigSchema.parse(JSON.parse(raw));
  } catch (error) {
    if (isMissingFileError(error)) {
      return AgentHarnessConfigSchema.parse({});
    }

    throw error;
  }
}

function isMissingFileError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ENOENT"
  );
}
