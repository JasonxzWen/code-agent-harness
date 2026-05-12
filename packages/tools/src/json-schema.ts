import type { JsonObject } from "@code-agent-harness/core";

export function objectJsonSchema(
  properties: JsonObject,
  required: string[] = []
): JsonObject {
  // What: 生成与 Zod strict schema 对齐的 JSON schema。Why: provider 侧也应知道
  // unknown fields 不被接受。How: 默认设置 additionalProperties=false，并显式列出 required。
  return {
    type: "object",
    additionalProperties: false,
    properties,
    required
  };
}

export const stringSchema = {
  type: "string"
} satisfies JsonObject;

export const integerSchema = {
  type: "integer"
} satisfies JsonObject;

export const stringArraySchema = {
  type: "array",
  items: {
    type: "string"
  }
} satisfies JsonObject;
