# 路线图

本项目现在定位为 TypeScript Coding Agent Runtime Research Harness。路线图不再追求泛化产品化，而是围绕 Claude Code / Codex-like coding agent 的 public behavior 和 design inference，通过 learning-by-building 研究 runtime 机制。

## 已交付基线

| Release | Theme               | 已交付范围                                                                                           |
| ------- | ------------------- | ---------------------------------------------------------------------------------------------------- |
| v0.1    | Minimal Agent Loop  | 最小 agent loop、read tools、tool validation、permission gate 和 JSONL trace。                       |
| v0.2    | Patch-capable Agent | 受控 `apply_patch`、permission preview、写入前 approval 和 patch policy tests。                      |
| v0.3    | Evaluation Harness  | deterministic eval harness、fixed task matrix、JSONL trace parsing、JSON / Markdown / HTML reports。 |

## 研究路线

### v0.3.1 Research Harness Alignment

- Research question：项目定位、README、roadmap、AGENTS、CHANGELOG 和 charter 是否能准确表达 research harness，而不夸大 runtime 已实现能力？
- Public product behavior being studied：现代 coding agent 项目通常会把 capability map、release scope、known limitations 和 evidence entrypoints 放在第一屏文档中，帮助用户判断工具当前能做什么。
- Minimal implementation target：只同步文档定位、路线图、研究入口和 release 叙述；保留 `package.json` version；不改 runtime 代码。
- Non-goals：不实现 memory、subagents、orchestration、skills runtime、hooks runtime、permission modes、sandbox、provider 或 UI。
- Evidence to collect：`bun run format:check`、文档 diff、HTML handoff report、review focus anchors。
- Interview value：能解释为什么 research harness 需要把已实现能力、研究问题和未来推断分开，避免把 public behavior 误写成内部实现。

### v0.4 Scoped Instruction & Memory

- Research question：scoped instructions 和 project memory 如何在帮助 agent 的同时避免污染当前任务？
- Public product behavior being studied：Claude Code / Codex-like tools 会暴露项目指令、局部规则、历史偏好和上下文恢复行为，但不会要求用户理解完整 prompt 拼接细节。
- Minimal implementation target：实现可见、可审查、repo-local 的 instruction scope 和 memory 读取路径；记录进入 prompt/context 的来源、优先级和截断结果。
- Non-goals：不实现云同步 memory、跨用户画像、隐式长期记忆、自动总结守护进程或 provider-specific memory API。
- Evidence to collect：fixture repo 中的 instruction precedence cases、memory inclusion/exclusion traces、污染防护 failure cases、HTML evidence report。
- Interview value：能回答“coding agent 如何组织项目指令和记忆”，并说明 deterministic scope rules 为什么比 prompt-only 约定可靠。

### v0.5 Subagent Runtime

- Research question：subagents 如何获得隔离上下文、明确职责和可合并结果，而不破坏主 agent 的决策边界？
- Public product behavior being studied：现代 coding agents 会把探索、review、test 或实现任务拆给不同 worker，并把结果汇总回主流程。
- Minimal implementation target：实现本地 deterministic subagent runner、context isolation、bounded task input/output、result summary 和 trace linking。
- Non-goals：不做真实并行云执行、不做任意 agent marketplace、不做自动权限升级、不让 subagent 绕过主流程安全策略。
- Evidence to collect：subagent context snapshots、handoff summaries、failed subtask traces、主 agent 汇总质量对比。
- Interview value：能解释 subagent 与普通函数调用、tool call、background job 的边界差异。

### v0.6 Agent Team Orchestration MVP

- Research question：task lists、mailboxes 和 explicit handoff 能否让多 agent 协作保持可追踪、可暂停和可恢复？
- Public product behavior being studied：coding agent 团队会呈现 plan、task ownership、progress updates、review loops 和跨角色消息。
- Minimal implementation target：实现小型 orchestration MVP：task list state、mailbox messages、role assignment、progress events 和 final aggregation。
- Non-goals：不做复杂 scheduler、不做无限 agent tree、不做真实组织权限模型、不做远程协作服务。
- Evidence to collect：orchestration trace、mailbox transcript、stale task handling、manual interruption/recovery cases。
- Interview value：能说明 agent team orchestration 的核心不是“多开几个模型”，而是 ownership、state 和 communication protocol。

### v0.7 Skills & Progressive Disclosure

- Research question：skills 如何把任务专用知识按需加载，减少默认上下文负担，同时保持可审查和可复用？
- Public product behavior being studied：现代 coding agents 会通过 skills、plugins 或 workflow recipes 延迟加载领域规则、脚本和模板。
- Minimal implementation target：实现 repo-local skill manifest、progressive disclosure loader、skill evidence trace 和 deterministic fixture skill。
- Non-goals：不做远程 skill marketplace、不做自动安装第三方代码、不做隐式执行 skill scripts、不做通用 plugin runtime。
- Evidence to collect：skill discovery trace、loaded file list、context size comparison、missing/blocked skill fallback cases。
- Interview value：能解释 progressive disclosure 如何降低 prompt bloat，以及 skill loader 必须如何处理安全边界。

### v0.8 Hooks & Lifecycle Automation

- Research question：生命周期 hooks 如何在不隐藏副作用的情况下，为 agent workflow 提供可预测的前置和后置自动化？
- Public product behavior being studied：coding agents 常见 preflight、post-edit validation、handoff generation、cleanup 和 notification hooks。
- Minimal implementation target：实现显式配置的 lifecycle hooks：pre-run、post-edit、pre-final、post-report；每个 hook 都有 dry-run、trace 和 failure policy。
- Non-goals：不做后台 daemon、不做全局 shell hook、不做未批准写入、不做 secret-bearing automation。
- Evidence to collect：hook execution trace、failure policy cases、skipped hook reasons、hook-generated artifact references。
- Interview value：能回答 hooks 与 tools、scripts、CI 的关系，以及为什么 lifecycle automation 必须可见、可禁用、可审计。

### v0.9 Permission Modes & Sandbox-lite

- Research question：permission modes 和 sandbox-lite 如何在 developer velocity 与 destructive-risk control 之间取得可解释平衡？
- Public product behavior being studied：Claude Code / Codex-like tools 会暴露 read/write/command/network 权限模式、approval prompts 和 workspace isolation。
- Minimal implementation target：实现 repo-local permission modes、command/edit risk classification、sandbox-lite path boundary 和 audit trace。
- Non-goals：不做 OS-level full sandbox、不做 container platform、不做网络策略引擎、不做绕过用户确认的 destructive operations。
- Evidence to collect：permission matrix tests、denied action traces、path boundary cases、approval prompt snapshots、sandbox-lite limitation notes。
- Interview value：能解释 permission mode 不是 UI 开关，而是 policy engine、tool validation、execution boundary 和 evidence trail 的组合。

### v1.0 Comparative Runtime Report

- Research question：通过本项目逐步构建的 runtime 机制，能否形成一份可验证的现代 coding agent runtime 对比报告？
- Public product behavior being studied：Claude Code、Codex、opencode 和其他公开 coding agent 工具在 instructions、memory、subagents、skills、hooks、permissions、trace 和 eval 上呈现不同产品形态。
- Minimal implementation target：整理 v0.1 到 v0.9 的实现证据、trace、eval artifacts、limitations 和 public-behavior comparison，形成本地 HTML / Markdown comparative runtime report。
- Non-goals：不声称掌握任何闭源产品内部实现，不做排行榜，不做绝对性能 benchmark，不做营销网站。
- Evidence to collect：release evidence index、feature-by-feature comparison matrix、fixture results、trace excerpts、known limitation map。
- Interview value：能系统讲清现代 coding agent runtime 的组成、边界、风险和可验证设计，而不是只会描述 UI 表象。

## 研究边界

- 只基于公开行为、公开文档、可观察产品交互和本项目实现证据做 design inference。
- 不写 Claude Code、Codex 或其他闭源产品的内部实现细节。
- 每个 runtime 主题先写 research 和 spec，再实现最小可验证 slice。
- 每个 release 都必须留下 tests、eval evidence、trace 或 HTML handoff report。
- 不因研究同类产品而扩大当前 release scope。
