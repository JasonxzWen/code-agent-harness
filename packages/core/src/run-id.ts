import { randomUUID } from "node:crypto";

export function createRunId(now = new Date()): string {
  const stamp = now
    .toISOString()
    .replaceAll(/[-:.TZ]/g, "")
    .slice(0, 14);
  const entropy = randomUUID().slice(0, 8);
  return `run-${stamp}-${entropy}`;
}
