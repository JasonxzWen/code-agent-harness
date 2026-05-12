# Roadmap

本项目通过小而可运行的 releases 演进。

| Release | Theme                | Core question                                                    | Main deliverable                                          |
| ------- | -------------------- | ---------------------------------------------------------------- | --------------------------------------------------------- |
| v0.1    | Minimal Coding Agent | agent 能否通过 tools inspect 真实 repo，并产出 grounded answer？ | TUI + loop + read tools + trace                           |
| v0.2    | Patch-capable Agent  | agent 能否安全 propose 和 apply code changes？                   | diff preview + approval + write tools                     |
| v0.3    | Evaluation Harness   | behavior regressions 能否被度量？                                | fixture tasks + trace scoring + reports                   |
| v0.4    | Context Engineering  | agent 能否在 budget 下选择更好的 context？                       | repo map + file ranking + truncation strategy             |
| v0.5    | Workflow Reliability | agent 能否从常见失败中恢复？                                     | retry, timeout, failure taxonomy, resumability groundwork |
| v0.6    | Memory-lite          | project memory 能否在不污染任务的情况下提供帮助？                | visible local memory store                                |
| v0.7    | Delegation           | bounded subflows 能否提升质量？                                  | context-isolated delegation inside the product            |
| v0.8    | Sandbox              | 更强隔离能否降低 command/edit risk？                             | sandbox adapter and policy engine                         |
| v1.0    | Public Harness       | runtime 是否足够稳定，可供更广泛使用？                           | stable APIs, docs, eval baseline, release process         |

## Scope rule

每个 proposed feature 在 implementation 前必须分类：

```txt
v0.1 blocker
v0.1 nice-to-have
later release
reject
```

## 当前硬性规则

v0.1 release 前不要实现 file editing。
