import { describe, expect, test } from "bun:test";
import { shouldAbortRunInput } from "../src/interaction";

describe("CLI interaction", () => {
  test("maps q and Ctrl+C to run abort", () => {
    expect(shouldAbortRunInput("q", {})).toBe(true);
    expect(shouldAbortRunInput("Q", {})).toBe(true);
    expect(shouldAbortRunInput("c", { ctrl: true })).toBe(true);
  });

  test("keeps permission decision keys separate from run abort", () => {
    expect(shouldAbortRunInput("y", {})).toBe(false);
    expect(shouldAbortRunInput("n", {})).toBe(false);
    expect(shouldAbortRunInput("d", {})).toBe(false);
    expect(shouldAbortRunInput("c", {})).toBe(false);
  });
});
