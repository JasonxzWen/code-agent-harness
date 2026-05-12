export interface KeyInput {
  ctrl?: boolean;
}

export function shouldAbortRunInput(input: string, key: KeyInput): boolean {
  // What: 把 `q` 和 Ctrl+C 统一成 run abort 意图。Why: TUI 和测试需要共享同一套
  // 交互判断。How: 只看输入字符和 ctrl 标志，不依赖 Ink 组件状态。
  return (
    (key.ctrl === true && input.toLowerCase() === "c") || input.toLowerCase() === "q"
  );
}
