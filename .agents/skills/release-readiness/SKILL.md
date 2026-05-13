---
name: release-readiness
description: 创建或准备 release 前使用，检查 release contract、quality gates、docs、changelog、known limitations 和 demo readiness。
---

## 语言政策

- 在本仓库中，release-readiness reports 和新增 release-facing docs 使用中文。
- 代码标识符、命令、路径、包名、API 名称、外部项目名和来源标题保留原文。
- 检查 release notes、feature cards、E2E evidence 和 benchmark evidence 时遵守 `docs/engineering/language-policy.md`。

## Release readiness 工作流

1. 阅读 `docs/releases/<version>-contract.md`。
2. 检查已实现 scope 是否匹配 contract。
3. 确认 non-goals 没有滑入。
4. 运行或确认 quality gates。
5. 检查 README、CHANGELOG、ADRs、architecture docs 和 release notes。
6. 确认每个用户可见 feature 都有 feature card，覆盖它是什么、用户需求、主场景、industry practice、本项目方案、为什么适合、如何实现、E2E acceptance、benchmark evidence 和 limitations。
7. 确认每个用户可见 feature 都有 E2E acceptance evidence。除非 feature 不是用户可见行为且例外已记录，否则 unit tests alone 不足以发布。
8. 确认 release features 的 benchmark evidence：benchmark question、metric、fixture、command 或 artifact、threshold、result、peer baseline 和 caveats。
9. 确认 demo script 和 fixture repo。
10. 确认 release 或 Ralph loop 完成后存在 self-contained HTML 变更汇报；默认路径为 `.agent-harness/reports/latest/change-report.html`。如果未产出，必须把原因记录为 release readiness limitation。
11. 产出 release readiness report：

- scope status；
- quality status；
- docs status；
- feature-card status；
- E2E acceptance status；
- benchmark status；
- HTML change report status；
- known limitations；
- blockers；
- release recommendation。

除非用户明确要求，不要创建 Git tag 或 push。
