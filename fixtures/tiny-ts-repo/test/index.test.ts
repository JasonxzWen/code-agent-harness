import { expect, test } from "bun:test";
import { greet } from "../src/index";

test("greet returns a stable message", () => {
  expect(greet("agent")).toBe("hello, agent");
});
