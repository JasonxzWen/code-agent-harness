#!/usr/bin/env bun
import { render } from "ink";
import React from "react";
import { App } from "./App";
import { parseCliArgs } from "./args";

// What: CLI entrypoint 只负责把 argv 变成 Ink props 并启动 TUI。Why:
// 入口层保持薄，可以让 agent loop、provider 和 permission 逻辑继续留在可测试模块。
// How: parseCliArgs 归一化参数，只有存在 initial task 时才把它传给 App。
const args = parseCliArgs(process.argv.slice(2));
const props =
  args.task === undefined
    ? {
        repoRoot: args.repoRoot,
        live: args.live
      }
    : {
        repoRoot: args.repoRoot,
        initialTask: args.task,
        live: args.live
      };

render(<App {...props} />);
