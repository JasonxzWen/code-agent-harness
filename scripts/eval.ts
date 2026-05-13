import { runEvalCli } from "./eval-harness";

process.exitCode = await runEvalCli(process.argv.slice(2));
