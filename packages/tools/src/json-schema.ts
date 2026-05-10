import type { JsonObject } from "@code-agent-harness/core";

export function objectJsonSchema(
  properties: JsonObject,
  required: string[] = []
): JsonObject {
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
