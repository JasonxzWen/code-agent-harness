# Release Checklist

| 状态 | 项目                                     | 证据 / 下一步                                                                                                                                                            |
| ---- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [x]  | release contract 已存在                  | `docs/releases/v0.1.0-contract.md`                                                                                                                                       |
| [x]  | scope 匹配 contract                      | `docs/checklists/v0.1-readiness-gap-list.md` 中的 scope guard 已满足。                                                                                                   |
| [x]  | v0.1 readiness gap list 无 open blockers | F-14 abort evidence 已记录；无剩余 release blockers。                                                                                                                    |
| [x]  | permission gate 证据已记录               | `packages/core/test/agent-loop.test.ts`；`apps/cli/src/App.tsx`；readiness checklist evidence 已记录。                                                                   |
| [x]  | strict tool validation 证据已记录        | `packages/tools/test/tools.test.ts`；readiness checklist evidence 已记录。                                                                                               |
| [x]  | quality gates 通过                       | `bun run quality` 通过，并包含 `bun run build`。                                                                                                                         |
| [x]  | smoke test 通过                          | `bun run smoke` 作为 F-14 quality run 的一部分已通过。                                                                                                                   |
| [x]  | live smoke 状态已记录                    | `bun run smoke:live` 因 `OPENAI_API_KEY` 未设置而 skipped。                                                                                                              |
| [x]  | README 已更新                            | README 记录当前 v0.1 scope、usage、safety model 和 limitations。                                                                                                         |
| [x]  | CHANGELOG 已更新                         | CHANGELOG 包含当前 v0.1 safety hardening 条目。                                                                                                                          |
| [x]  | release note 已写入                      | `docs/releases/v0.1.0.md` 记录 features、Mermaid flow、key code definitions、rationale、industry comparison、quality 和 limitations。                                    |
| [x]  | release note 包含 Mermaid change map     | `docs/releases/v0.1.0.md` 包含 v0.1 runtime path 的 `mermaid` flowchart。                                                                                                |
| [x]  | key logic 和 code definitions 已索引     | `docs/releases/v0.1.0.md` 将 core logic 映射到 `apps/cli`、`packages/core`、`packages/tools` 和 `packages/providers` files。                                             |
| [x]  | implementation rationale 已记录          | `docs/releases/v0.1.0.md` 解释 read-only v0.1、internal tool protocol、tool-driven inspection、OpenAI first、JSONL trace 和 command allowlist。                          |
| [x]  | industry comparison 已刷新               | `docs/research/comparable-projects.md` 和 `docs/research/industry-reference-map.md` 覆盖 Codex、Claude Code、opencode、OpenClaw、Hermes Agent、OpenHands 和 Aider。      |
| [ ]  | feature cards 完整                       | 每个 user-visible feature 必须记录 what/why/how、user need、primary scenario、industry practice、our approach、e2e acceptance、benchmark 和 limitations。                |
| [ ]  | e2e acceptance 已记录                    | 每个 user-visible feature 必须有 user-entrypoint-to-evidence validation，或 documented blocker/exception。                                                               |
| [ ]  | benchmark evidence 已记录                | 每个 release feature 必须记录 benchmark question、metrics、fixture、command/artifact、threshold、result、peer baseline 和 caveats。                                      |
| [x]  | future Chinese documentation rule 已记录 | `docs/engineering/release-documentation-standard.md` 要求从 `v0.2.0` 开始新增 release docs 使用中文正文。                                                                |
| [x]  | ADRs 已更新                              | Existing ADRs cover read-only v0.1、Zod tool protocol、JSONL logging、provider boundary、permission gate 和 no memory。该 documentation standard update 不需要新增 ADR。 |
| [x]  | demo 已记录                              | `docs/examples/v0.1-demo-script.md` 匹配当前 deterministic fixture demo。                                                                                                |
| [x]  | known limitations 已记录                 | README、release contract 和 release note 记录 read-only v0.1 limitations。                                                                                               |
| [ ]  | git tag 已准备                           | 在 local experience、final release-note verification 和 explicit tag approval 后再准备。                                                                                 |
