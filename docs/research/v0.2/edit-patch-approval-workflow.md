# 调研：Edit/Patch Approval Workflow

## 问题

v0.1 已经证明了只读 agent loop、工具校验、权限 gate、受限命令和 JSONL trace。v0.2 的 release 目标是让 agent 能安全地提出并应用代码修改。风险点从“读取是否安全”升级为“写入是否可审查、可拒绝、可追踪、不会覆盖用户工作”。

本研究回答：

- patch 能力应该用统一 diff、结构化写文件，还是 shell 命令？
- 用户批准应该发生在 patch 生成前、预检后，还是执行后回滚？
- 如何限制路径、secret、二进制文件、dirty file、输出体积和 trace 泄漏？
- v0.2 应该做到什么程度，哪些能力必须推迟？

## Release 相关性

Scope classification: `later release`，目标 release 为 `v0.2.0 Patch-capable Agent`。

它直接对应 roadmap 中的 v0.2：

```txt
diff preview + approval + write tools
```

## 已检查来源

本地项目资料：

- `docs/roadmap.md`
- `docs/releases/v0.1.0.md`
- `docs/releases/v0.1.0-contract.md`
- `docs/architecture/v0.1-minimal-coding-agent.md`
- `docs/agent/tool-protocol.md`
- `docs/agent/permission-system.md`
- `docs/engineering/release-documentation-standard.md`
- `docs/research/industry-reference-map.md`
- `docs/research/comparable-projects.md`
- `docs/specs/v0.1/permission-gate-and-strict-tool-validation.md`
- `docs/research/v0.1/permission-gate-and-strict-tool-validation.md`

外部资料：

- OpenAI Codex sandboxing: https://developers.openai.com/codex/concepts/sandboxing
- Claude Code permissions: https://code.claude.com/docs/en/permissions
- opencode permissions: https://opencode.ai/docs/permissions/
- Aider chat modes: https://aider.chat/docs/usage/modes.html
- Git `apply` manual: https://git-scm.com/docs/git-apply
- OpenHands sandbox overview: https://docs.openhands.dev/openhands/usage/sandboxes/overview
- Hermes Agent README: https://github.com/NousResearch/hermes-agent

## 行业实践

| 项目         | 可复用信号                                                                      | 对本项目的含义                                                                       |
| ------------ | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| OpenAI Codex | 强调 workspace/sandbox/approval boundary，写入能力需要环境边界和用户可控审批。  | v0.2 不应把写入交给 prompt；必须由代码层 policy 和 permission gate 执行。            |
| Claude Code  | permissions 支持按工具和命令控制，读写行为分层。                                | patch 工具应默认 `ask`，并且批准不能覆盖 deterministic deny。                        |
| opencode     | permissions 可以精确到 tool 和 bash pattern。                                   | v0.2 应把 patch apply 作为明确 tool，而不是扩展 `run_command` 允许写命令。           |
| Aider        | architect/editor mode 把计划和编辑职责分开。                                    | 本项目可保留单 agent loop，但应在工具层显式分开“预检/预览”和“写入”。                 |
| Git apply    | `git apply --check` 可在应用前检查 patch 是否可应用；默认失败不应留下部分应用。 | patch apply 可以复用 Git 的 patch 语义，但必须包在路径/secret/dirty-file policy 内。 |
| OpenHands    | 完整系统常用 sandbox 降低执行风险。                                             | v0.2 还不实现 sandbox，因此必须缩小写入面和拒绝高风险 patch。                        |
| Hermes Agent | 平台型 agent 组合 tools、skills、memory、MCP、cron 等能力。                     | v0.2 不追完整平台，只交付本地 patch approval 闭环。                                  |

## 备选方案

| 方案                                | 描述                                            | 决策                                                                    |
| ----------------------------------- | ----------------------------------------------- | ----------------------------------------------------------------------- |
| Prompt-only approval                | 让模型在回答里询问用户，然后再输出修改方案。    | 拒绝：安全依赖 prompt，无法保证工具层不写。                             |
| 扩展 `run_command` 允许 `git apply` | 让模型用命令工具执行 patch。                    | 拒绝：会扩大 shell/argv 风险，也弱化 patch-specific policy。            |
| `write_file` 直接覆写文件           | 工具接收 path 和 content，整文件替换。          | 暂缓：适合创建小文件，但第一版更需要 diff 预览和上下文匹配。            |
| `apply_patch` 接收 unified diff     | 工具接收 patch，预检后展示 diff，再经批准应用。 | 接受：符合用户审查习惯，可做 diffstat、路径分析和 clean apply 检查。    |
| 生成 PR 而不是修改工作区            | agent 只输出 branch/PR。                        | 暂缓：需要 git write、commit、push 和 GitHub 集成，超出 v0.2 最小闭环。 |
| 沙箱中试应用再复制结果              | 先在 sandbox/worktree 应用。                    | 暂缓：更安全但需要 sandbox/worktree adapter，属于 v0.8 方向。           |

## 取舍矩阵

| 标准             | Prompt-only | `run_command git apply` | `write_file` | `apply_patch` |
| ---------------- | ----------- | ----------------------- | ------------ | ------------- |
| 用户可审查 diff  | 低          | 中                      | 低           | 高            |
| 代码层安全策略   | 低          | 中                      | 中           | 高            |
| v0.2 scope fit   | 低          | 中                      | 中           | 高            |
| 实现复杂度       | 低          | 中                      | 中           | 中            |
| 避免覆盖用户工作 | 低          | 中                      | 中           | 高            |
| 后续扩展到 PR    | 低          | 中                      | 中           | 高            |

## 项目约束

- `packages/core` 不能导入 Ink 或 provider SDK。
- `packages/providers` 不能看到工具实现细节。
- `packages/tools` 拥有路径、secret、binary、dirty-file、patch size 和 apply policy。
- CLI 可以渲染 patch preview，但不能直接执行工具。
- v0.2 没有 sandbox runtime，因此 patch policy 必须保守。
- 模型生成的 patch 是不可信输入，必须先 schema 校验，再 policy 检查，再 permission gate，再执行。
- trace 需要可用于调试，但不能写入完整大 diff 或 secret 内容。

## 建议方案

v0.2 采用一个受控 `apply_patch` 工具：

1. 输入为 bounded unified diff。
2. `prepare` 阶段解析 patch 路径，拒绝 repo 外路径、secret-looking 路径、binary/mode/symlink change、超限 patch 和 touched dirty files。
3. `prepare` 阶段生成 diffstat、文件列表、风险摘要和截断 diff preview。
4. `PermissionGate` 在预检成功后展示 preview；只有用户批准才执行写入。
5. `execute` 阶段重新验证 patch 和 touched-file 状态，然后应用 patch。
6. 写入后返回结构化结果：修改文件、增删行、preview 是否截断、是否应用成功。
7. trace 记录 patch 生命周期事件和 bounded metadata。

这要求 v0.2 对 `PreparedToolCall` 或 `PermissionRequest` 增加 preview metadata，而不是让 CLI 自己从 raw input 推断 diff。

## 影响的验收标准

- 新增 F-02 到 F-11 patch 功能接受标准。
- 新增 S-01 到 S-12 patch 安全接受标准。
- 保持 v0.1 的 F-01 到 F-14 和 S-01 到 S-09 不回归。

## 待确认问题

- v0.2 是否允许创建新文件？建议允许文本新文件，但拒绝二进制和 secret-looking path。
- v0.2 是否允许删除文件？建议第一版允许删除普通文本文件，但 preview 必须显式标记。
- v0.2 是否允许 rename？建议暂缓，避免路径双端 policy 和 platform 差异。
- 是否需要全局 clean working tree？建议只拒绝 patch touched files 已 dirty，允许无关 dirty 文件存在。
- 是否需要 `write_file`？建议 v0.2 先不做，避免同时引入两种写入语义。
