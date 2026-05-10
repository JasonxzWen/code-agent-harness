# Roadmap

The project evolves through small, runnable releases.

| Release | Theme                | Core question                                                                  | Main deliverable                                          |
| ------- | -------------------- | ------------------------------------------------------------------------------ | --------------------------------------------------------- |
| v0.1    | Minimal Coding Agent | Can the agent inspect a real repo through tools and produce a grounded answer? | TUI + loop + read tools + trace                           |
| v0.2    | Patch-capable Agent  | Can the agent safely propose and apply code changes?                           | diff preview + approval + write tools                     |
| v0.3    | Evaluation Harness   | Can behavior regressions be measured?                                          | fixture tasks + trace scoring + reports                   |
| v0.4    | Context Engineering  | Can the agent select better context under budget?                              | repo map + file ranking + truncation strategy             |
| v0.5    | Workflow Reliability | Can the agent recover from common failures?                                    | retry, timeout, failure taxonomy, resumability groundwork |
| v0.6    | Memory-lite          | Can project memory help without polluting tasks?                               | visible local memory store                                |
| v0.7    | Delegation           | Can bounded subflows improve quality?                                          | context-isolated delegation inside the product            |
| v0.8    | Sandbox              | Can command/edit risk be reduced with stronger isolation?                      | sandbox adapter and policy engine                         |
| v1.0    | Public Harness       | Is the runtime stable enough for broader use?                                  | stable APIs, docs, eval baseline, release process         |

## Scope rule

Every proposed feature must be classified before implementation:

```txt
v0.1 blocker
v0.1 nice-to-have
later release
reject
```

## Current hard rule

Do not implement file editing before v0.1 is released.
