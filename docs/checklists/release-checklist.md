# Release Checklist

| Status | Item                                         | Evidence / next action                                                                                                                                             |
| ------ | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [x]    | release contract exists                      | `docs/releases/v0.1.0-contract.md`                                                                                                                                 |
| [x]    | scope matches contract                       | Scope guard in `docs/checklists/v0.1-readiness-gap-list.md` is satisfied.                                                                                          |
| [x]    | v0.1 readiness gap list has no open blockers | F-14 abort evidence is recorded; no release blockers remain.                                                                                                       |
| [x]    | permission gate evidence recorded            | `packages/core/test/agent-loop.test.ts`; `apps/cli/src/App.tsx`; readiness checklist evidence recorded.                                                            |
| [x]    | strict tool validation evidence recorded     | `packages/tools/test/tools.test.ts`; readiness checklist evidence recorded.                                                                                        |
| [x]    | quality gates pass                           | `bun run quality` passed after F-14 abort evidence.                                                                                                                |
| [x]    | smoke test passes                            | `bun run smoke` passed as part of the F-14 quality run.                                                                                                            |
| [x]    | README updated                               | README documents current v0.1 scope, usage, safety model, and limitations.                                                                                         |
| [x]    | CHANGELOG updated                            | CHANGELOG includes current v0.1 safety hardening entry.                                                                                                            |
| [ ]    | release note written                         | Create release note before tagging.                                                                                                                                |
| [x]    | ADRs updated                                 | Existing ADRs cover read-only v0.1, Zod tool protocol, JSONL logging, provider boundary, permission gate, and no memory. No new ADR needed for the checklist sync. |
| [x]    | demo documented                              | `docs/examples/v0.1-demo-script.md` matches the current deterministic fixture demo.                                                                                |
| [x]    | known limitations documented                 | README and release contract document read-only v0.1 limitations.                                                                                                   |
| [ ]    | git tag prepared                             | Prepare only after all blockers are closed.                                                                                                                        |
