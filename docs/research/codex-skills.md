# Codex skills

本文拆解 Codex skills 和 progressive disclosure 的公开行为，并映射到 `code-agent-harness` 的 `v0.7 Skills & Progressive Disclosure`。它不描述 Codex 的闭源内部实现。

调研刷新日期：2026-05-14。

## Public behavior

OpenAI Codex 官方文档描述 skill 是一个目录，包含 required `SKILL.md` 和可选 `scripts/`、`references/`、`assets/`、`agents/`。`SKILL.md` 需要 `name` 和 `description`，用于让 Codex 决定何时使用该 skill。

公开行为包括：

- Codex 初始 context 中只放 skill metadata，用于 discovery；
- 为避免挤占 prompt，初始 skill list 有 context budget；
- 当 Codex 选择 skill 后，才读取完整 `SKILL.md`；
- references 和 scripts 仅在需要时使用；
- skills 可被显式调用，也可根据 description 隐式触发；
- Codex 会从 repo、user、admin 和 system locations 读取 skills；
- 同名 skills 不合并，可能同时出现在 selector 中。

Customization 文档把 skills 定位为 reusable workflows 和 domain expertise，并建议当 workflow 需要外部系统时与 MCP 搭配。

## Design inference

本项目的设计推断是：skills 机制的核心是 progressive disclosure。默认只暴露轻量 metadata，让 agent 能选择；完整 instruction、examples、references 和 scripts 延迟到真正需要时加载。

这解决的是 context bloat 和 workflow reuse，而不是“让所有规则常驻 prompt”。但它也引入安全边界：skill scripts 不能因 skill 被选中就自动执行，references 不能无限读取，repo skill 与 user skill 的信任级别需要区分。

## What this project will reproduce

`v0.7` 计划复现 repo-local skill loader：

- 扫描 `.agents/skills` fixture；
- 只把 `name`、`description`、path 放入 discovery context；
- 显式记录 skill selected / loaded / reference read；
- 支持 instruction-only skill；
- 对 script-backed skill 默认需要 permission；
- eval 覆盖 missing skill、ambiguous skill、large skill list 和 blocked script。

## What this project will not reproduce

- 不实现 Codex plugin distribution。
- 不自动安装第三方 skill 或脚本依赖。
- 不实现 MCP integration。
- 不允许 skill script 隐式执行。
- 不复现 Codex system/admin/user 全部目录层级。

## Minimal runtime components

- `SkillManifest`：name、description、scope、path、hash。
- `SkillDiscoveryIndex`：bounded metadata list 和 omitted warning。
- `SkillLoader`：按 request 加载 `SKILL.md`。
- `SkillReferenceReader`：按需读取 references。
- `SkillScriptPolicy`：脚本执行前走 permission gate。
- `SkillTraceAdapter`：输出 discovery、selection、load 和 script policy events。

## Trace events to collect

- `skill.discovered`
- `skill.discovery_truncated`
- `skill.selected`
- `skill.loaded`
- `skill.reference_loaded`
- `skill.script_requested`
- `skill.script_blocked`
- `skill.script_completed`
- `skill.missing`
- `skill.ambiguous`

## Failure modes

- description 太模糊，导致隐式触发错误 skill。
- skill list 过大，关键 skill metadata 被省略。
- 同名 skills 同时存在，选择不稳定。
- Skill instruction 要求运行脚本，但脚本未经 permission。
- references 过大或包含敏感数据。
- Skill 变更后缓存未刷新，用户以为新规则生效。

## Security and privacy concerns

- repo skill 来自仓库内容，不能自动扩大权限。
- scripts 必须按 command/write policy 处理。
- references 进入 context 前需要 size budget 和 redaction。
- trace 不应写完整 large references 或 secret。
- skills 与 MCP/外部系统组合时必须单独建 trust boundary。

## Eval ideas

- Metadata-only fixture：初始 context 只含 name/description/path，不含完整 `SKILL.md`。
- Explicit invocation fixture：用户点名 skill 后加载完整指令。
- Implicit matching fixture：任务匹配 description 后选择 skill。
- Ambiguous fixture：两个 skill 描述相近，runtime 要求 disambiguation 或标记 ambiguous。
- Script permission fixture：skill script 请求执行，permission gate 拒绝并 trace。

## Interview explanation

可以这样解释：skills 是“可发现但不常驻”的工作流包。progressive disclosure 让 agent 先看到目录卡片，只有选中后才打开完整手册。这样能减少默认 context 压力，同时让 workflow 有脚本、模板和引用资料。但 script 和 external tool 仍必须走权限边界。

## Open questions

- v0.7 第一版是否只支持 instruction-only skills？
- 是否需要支持 nested repo skills？
- skill selection 是模型决定，还是 deterministic matcher 先推荐？
- Skill script 是否复用 `run_command`，还是定义独立 tool？
- HTML report 是否展示 skill load waterfall？

## Sources

| Source                                                       | Type          | Used for                                                                                         |
| ------------------------------------------------------------ | ------------- | ------------------------------------------------------------------------------------------------ |
| <https://developers.openai.com/codex/skills>                 | official docs | Codex skill directory structure、metadata budget、explicit/implicit invocation 和 locations。    |
| <https://developers.openai.com/codex/concepts/customization> | official docs | Skills as reusable workflows, progressive disclosure, MCP pairing and distribution via plugins。 |
