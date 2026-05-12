---
name: research-spec
description: 当非平凡功能、架构决策、provider 行为、工具设计、权限规则或 context/eval 变更需要先调研并写 spec 后再实现时使用。
---

遵循此工作流：

## 语言政策

- 在本仓库中，面向用户的输出和新增规划文档使用中文。
- 代码标识符、命令、路径、包名、API 名称、外部项目名和来源标题保留原文。
- 产出 release research、spec 和 alignment brief 时遵守 `docs/engineering/language-policy.md`。

## 步骤

1. 分类 scope：`v0.1 blocker`、`v0.1 nice-to-have`、`later release` 或 `reject`。
2. 检查现有 docs：release contract、architecture、standards、acceptance criteria、相关 ADR。
3. 对 release 工作，在实现前刷新主流产品扫描。至少从 OpenAI Codex、Claude Code、opencode 开始，再加入 Aider、OpenHands、OpenClaw、Hermes Agent 等 release-relevant peers。优先使用官方文档、官方仓库和 maintainer-authored material。
4. 只调研会影响决策的来源。把每个外部信号映射到本项目 release scope，不要把 research 变成 feature wishlist。
5. 使用 `docs/templates/research-note-template.md` 产出 `docs/research/<release>/<topic>.md`。
6. 使用 `docs/templates/spec-template.md` 产出 `docs/specs/<release>/<topic>.md`。
7. 提供 alignment brief，包含 problem、options、recommendation、trade-offs、acceptance criteria、E2E acceptance plan、benchmark question/metrics，以及已刷新的 industry scan。
8. 在用户批准或明确给出自动实现指令前，不要开始实现。

保持 research scope 收敛。不要用 research 扩大 release scope。
