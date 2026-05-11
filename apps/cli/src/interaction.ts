export interface KeyInput {
  ctrl?: boolean;
}

export function shouldAbortRunInput(input: string, key: KeyInput): boolean {
  return (
    (key.ctrl === true && input.toLowerCase() === "c") || input.toLowerCase() === "q"
  );
}
