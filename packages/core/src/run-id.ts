import { randomUUID } from "node:crypto";

export function createRunId(now = new Date()): string {
  // What: 生成可读且低冲突的 run id。Why: trace 文件、事件和最终汇报都需要同一
  // 锚点。How: 使用 UTC 时间戳方便排序，再追加 randomUUID 前缀增加熵。
  const stamp = now
    .toISOString()
    .replaceAll(/[-:.TZ]/g, "")
    .slice(0, 14);
  const entropy = randomUUID().slice(0, 8);
  return `run-${stamp}-${entropy}`;
}
