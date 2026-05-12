# 开发生命周期

本项目使用 release-driven engineering lifecycle。release 边界先于实现确定，所有公开行为都必须能追溯到 research、spec、验收证据和质量门禁。

## 生命周期

```txt
Research
→ Spec
→ Alignment
→ Implementation
→ Quality Gates
→ Self-review
→ Release Update
```

## 何时必须 research

每个 release 都必须先做 research。新增组件、公开契约、provider 行为、权限、context strategy、evaluation、安全策略或依赖选择，也必须先 research。

小修复如果正确行为已经被现有 spec、ADR 或 release contract 明确定义，可以不单独写 research note。

每个 release 在 implementation 开始前都必须完成 scoped industry scan。至少检查 OpenAI Codex、Claude Code 和 opencode 的当前公开材料，并按 release 相关性补充 Aider、OpenHands、OpenClaw、Hermes Agent 等 peers。industry scan 必须把外部行为映射到本项目当前 release scope，不能变成功能愿望清单。

## 何时可以 coding

满足以下条件后才可以开始 coding：

- scope classification 已明确；
- relevant release contract 未被违反；
- spec 已定义 acceptance criteria；
- release-relevant industry practice 已 review，或已明确说明不适用的原因；
- user-visible features 已有 E2E acceptance plan；
- release features 已有 benchmark question、metrics 和 expected evidence；
- public behavior 和 required tests 已明确。

## 实施期望

- 编辑前先 inspect relevant files；
- 保持 focused changes；
- 添加或更新 tests；
- 为 user-visible workflows 添加或更新 E2E acceptance；
- 为 release features 更新 benchmark evidence；
- public behavior 改变时更新 docs；
- behavior、capability boundaries、quality evidence 或 user-facing workflows 改变时更新 release documentation；
- 运行 quality gates；
- 对 diff 做 self-review；
- 如实报告 limitations；
- 暂停给 review 时，用 what changed、why、how 和具体 file:line 说明当前变更。

## Release 文档期望

Release update 必须遵守 `docs/engineering/release-documentation-standard.md`。

从 `v0.2.0` 开始，新增 release-facing docs 必须使用中文正文。Release note 必须包含 features、Mermaid diagrams、key code definition locations、implementation rationale、industry comparison、quality evidence、known limitations 和 next steps。

## 停止条件

遇到以下情况时，在 implementation 前停止：

- 请求与 release scope 冲突；
- 需要削弱 safety policy；
- public contract 会被破坏且没有 migration plan；
- 需要 credentials 或 paid services，但当前不可用；
- 请求执行 destructive operation。
