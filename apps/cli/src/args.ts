export interface CliArgs {
  repoRoot: string;
  task?: string;
  live: boolean;
}

export function parseCliArgs(argv: string[]): CliArgs {
  // What: 解析最小 CLI 参数集合。Why: v0.x CLI 需要保持 terminal-first 且可脚本化。
  // How: 只识别显式支持的 flags，未知参数先忽略，避免把 argparse 复杂度引入早期版本。
  const args: CliArgs = {
    repoRoot: process.cwd(),
    live: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg === "--repo" && next !== undefined) {
      args.repoRoot = next;
      index += 1;
      continue;
    }

    if (arg === "--task" && next !== undefined) {
      args.task = next;
      index += 1;
      continue;
    }

    if (arg === "--live") {
      args.live = true;
    }
  }

  return args;
}
