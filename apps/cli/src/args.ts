export interface CliArgs {
  repoRoot: string;
  task?: string;
  live: boolean;
}

export function parseCliArgs(argv: string[]): CliArgs {
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
