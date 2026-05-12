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
  // What: 加载可选本地配置并套用 schema defaults。Why: CLI 和 tests 需要
  // 无配置也能启动，同时外部输入必须被 Zod 校验。How: 文件缺失时解析空对象，
  // 其他 JSON/schema 错误继续抛出。
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
  // What: 只把 ENOENT 视为“配置不存在”。Why: 权限错误或 JSON 错误不能被吞掉。
  // How: 对 unknown error 做最小结构检查，避免依赖 Node 专有 Error 子类。
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ENOENT"
  );
}
