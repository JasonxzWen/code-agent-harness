#!/usr/bin/env bun
import { render } from "ink";
import React from "react";
import { App } from "./App";
import { parseCliArgs } from "./args";

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
