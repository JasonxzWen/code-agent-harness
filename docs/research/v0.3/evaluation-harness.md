# 调研：v0.3 Evaluation Harness

## 问题

本项目已经具备 read-only inspection、restricted command、permission gate、JSONL trace 和受控 `apply_patch`。问题是：当后续修改 agent loop、工具、provider 或 context 策略时，维护者能否用固定、可复现、可审查的方式度量 behavior regressions？

v0.3 的调研目标不是寻找最多功能的 agent 平台，而是回答哪些外部实践能支持本项目的最小评估闭环：固定任务、agent run、JSONL trace、deterministic checks、本地 report 和 limitations。

2026-05-13 补充调研范围：按用户要求检查 `JasonxzWen/skill-hub`，重点评估本项目的 agent 开发能力缺口，以及是否应把 HTML 工作报告纳入 v0.3 release evidence。

## 与 release 的关系

`docs/roadmap.md` 将 v0.3 定义为 `Evaluation Harness`，核心问题是 “behavior regressions 能否被度量？”。本 research 直接约束 `docs/specs/v0.3/evaluation-harness.md` 和 `docs/releases/v0.3.0-contract.md`，并明确不把外部平台能力扩展为 v0.3 wishlist。

## 已检查来源

| 项目         | 来源类型                    | URL                                                                               | v0.3 decision signal                                                                                                       |
| ------------ | --------------------------- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| OpenAI Codex | 官方文档和官方仓库          | https://developers.openai.com/codex/noninteractive                                | 非交互运行适合自动化 eval entrypoint；但本项目第一版只复用“scriptable run”思路。                                           |
| OpenAI Evals | 官方 cookbook / docs        | https://developers.openai.com/cookbook/examples/agents_sdk/agent_improvement_loop | agent improvement loop 应结合 traces 和 evals；本项目先用本地 JSONL trace 做 deterministic scoring。                       |
| Claude Code  | 官方文档                    | https://docs.anthropic.com/en/docs/claude-code/sdk                                | SDK / headless / structured output 支持自动化和成本跟踪；本项目第一版只做 deterministic local report。                     |
| opencode     | 官方文档                    | https://opencode.ai/docs/cli/                                                     | terminal-first CLI 可脚本化；permissions 是行为边界的一部分，v0.3 应把 permission events 纳入 scoring。                    |
| Aider        | maintainer-authored docs    | https://aider.chat/docs/leaderboards/                                             | 公开 benchmark 记录固定任务、pass rate、成本、超时、格式错误等指标；本项目借鉴指标结构，不做排行榜。                       |
| Aider        | maintainer-authored docs    | https://aider.chat/docs/usage/modes.html                                          | `ask` / `code` / `architect` 模式说明任务模式会影响结果；本项目 v0.3 固定 provider/task，避免模式漂移。                    |
| OpenHands    | 官方 benchmark repository   | https://github.com/OpenHands/benchmarks                                           | benchmark infrastructure 独立于主产品，包含多套任务；本项目应先做小型本地 harness，再考虑外部 benchmark。                  |
| OpenHands    | 官方仓库 README             | https://github.com/OpenHands/OpenHands                                            | OpenHands 区分 SDK、CLI、GUI、Cloud 和 benchmark infra；本项目 v0.3 不做平台化部署或 cloud eval。                          |
| OpenClaw     | 官方仓库 README / docs      | https://github.com/openclaw/openclaw                                              | OpenClaw 支持 one-shot agent CLI 和 `--json` 输出；本项目 report 也应保持 script-friendly。                                |
| OpenClaw     | 官方 CLI docs               | https://github.com/openclaw/openclaw/blob/main/docs/cli/agent.md                  | `--json` stdout 和 diagnostics stderr 分离有利于自动化；v0.3 report contract 应避免混合日志和结果。                        |
| Hermes Agent | 官方仓库 README             | https://github.com/NousResearch/hermes-agent                                      | Hermes 强调 batch trajectory generation 和 research-ready；本项目只保留 trajectory/trace 可评分方向。                      |
| Hermes Agent | maintainer-authored website | https://hermes-agent.ai/blog/hermes-agent-memory-system                           | 自我改进、memory、skills 和 session search 是 later scope；v0.3 不引入 memory 或 skill learning。                          |
| Skill Hub    | 用户指定参考仓库            | https://github.com/JasonxzWen/skill-hub                                           | 已有 `html-work-reports`、`--html --output`、JSON 优先/HTML 渲染同一数据模型的 CLI 报告边界；v0.3 应补齐本地 HTML report。 |

## 行业扫描

### OpenAI Codex

Codex 的非交互运行能力说明 coding agent 可以作为脚本化流程的一部分运行。OpenAI 的 agent improvement loop 材料把 traces、evals 和迭代改进放在同一闭环中。对本项目的信号是：v0.3 不应只跑 CLI smoke，而应让每个任务产生可评分 trace，并把结果沉淀为 report。

映射到 v0.3 scope：

- 采用 scriptable local eval command。
- 采用 trace-first evidence。
- 不引入 Codex workspace、cloud task、subagents 或 hosted eval。

### Claude Code

Claude Code SDK 和 headless 场景强调自动化调用、结构化输出、成本和 observability。对本项目的信号是：评估入口应该机器可读，report 应记录成本/时延字段的占位或缺失状态，但 v0.3 不需要先实现完整 OpenTelemetry 或 live cost accounting。

映射到 v0.3 scope：

- JSON report 是 P0，Markdown report 是 reviewer-friendly P0。
- metrics 字段允许 `null` / `not_collected`，不能猜测成本或时延。
- 不引入 Claude-specific SDK shape。

### opencode

opencode 继续验证 terminal-first coding agent 的方向，并且权限配置是 agent 行为边界的一部分。对本项目的信号是：v0.3 scoring 不能只看最终回答，还要看 permission 和 tool events 是否符合预期。

映射到 v0.3 scope：

- scoring 检查 `permission.requested`、`permission.decided` 和 tool result。
- permission regression 是 benchmark 指标之一。
- 不实现 per-agent permissions 或多 agent mode。

### Aider

Aider leaderboard 展示了固定任务集、pass rate、成本、耗时、格式错误、timeout、上下文耗尽等指标的价值。Aider modes 也说明不同工作模式会影响编辑结果。对本项目的信号是：v0.3 应先固定任务和 provider 行为，记录 pass/fail、trace completeness、step count、tool call count、denial count、report completeness 等指标。

映射到 v0.3 scope：

- 借鉴“先定义 benchmark question 和 metrics，再运行”的结构。
- 记录 local benchmark，不做 public ranking。
- 不引入 Aider repo map 或 architect/editor mode。

### OpenHands

OpenHands 把 benchmark infrastructure 独立成 repository，并覆盖 SWE-Bench、GAIA、Commit0、OpenAgentSafety 等任务。对本项目的信号是：benchmark 可以是独立 harness，而不是混入主产品 UI；但成熟外部 benchmark 太大，不适合作为 v0.3 P0。

映射到 v0.3 scope：

- evaluation harness 可以作为本地脚本和 report 体系独立存在。
- 外部 benchmark import 是 P1/later。
- v0.3 不需要 cloud runner、GUI 或大型 benchmark dataset。

### OpenClaw

OpenClaw 是个人 AI assistant 平台，CLI `openclaw agent` 支持 one-shot run 和 `--json` 输出，并说明 JSON stdout 与 diagnostics stderr 的分离。对本项目的信号是：eval command 必须可脚本化，输出结果和运行日志应分离。

映射到 v0.3 scope：

- JSON report contract 要稳定，适合 CI 或 release script 读取。
- 诊断信息和机器结果要有明确边界。
- 不引入 channel delivery、gateway fallback、skills 或 personal assistant scope。

### Hermes Agent

Hermes Agent 强调 long-running gateway、skills、memory、subagents、terminal backends、batch trajectory generation 和 research-ready 工作流。对本项目的信号是：trajectory/trace 可以用于评估和研究，但 self-improving、memory 和技能生成会扩大 v0.3 风险。

映射到 v0.3 scope：

- 保留 batch local task run 和 trace artifacts。
- 不做 memory、skill learning、cron、MCP、subagents 或 terminal backend matrix。

### Skill Hub

`skill-hub` 不是同类 runtime，而是一个面向 agent skill 生命周期的能力仓库和 CLI。它对本项目最有价值的信号不是安装更多 skills，而是三类工程能力：

- 能力发现：用 capability index、profile 和 deterministic analysis 描述目标 repo 已有能力与缺口。
- 报告边界：JSON 是机器契约，HTML 是同一数据模型的人类审查视图；`--html` 不应改变分析语义。
- HTML 工作报告：`html-work-reports` 明确覆盖 review、plan、status、research explainer 和 architecture walkthrough，并要求 one-file、无默认网络依赖、包含证据和 assumptions。

映射到 v0.3 scope：

- 在 `Evaluation Harness` 中保留 JSON report 为测试和 CI 契约。
- 新增 self-contained HTML report 作为 reviewer-facing artifact，而不是 dashboard、生产 UI 或线上服务。
- HTML report 必须复用 JSON report 数据模型，不能产生额外判断或隐藏失败证据。
- read-only eval 默认只写到用户指定的 `--out` 目录；未来若支持 stdout HTML，也必须与 JSON/Markdown 输出规则分离。

## 行业实践

跨项目共同信号：

1. 自动化评估需要固定输入和机器可读输出。
2. 只看最终回答不够，tool/permission/trace events 是 coding-agent 行为边界的一部分。
3. 成熟 benchmark 会记录 pass rate、cost、latency、timeout、format errors、failure reasons 和 caveats。
4. 外部 benchmark 和 hosted platform 能力有价值，但会显著扩大 scope。
5. 对本项目 v0.3，最小可交付是 local deterministic regression harness，不是通用 eval platform。
6. 当 report 需要支持 release review 时，Markdown 不够表达筛选、跳转、折叠和 evidence scan；静态 HTML 可以作为本地 artifact 补齐，但不能替代 JSON 契约。

## 备选方案

| 方案                           | 优点                                       | 风险 / 缺点                                               | 结论     |
| ------------------------------ | ------------------------------------------ | --------------------------------------------------------- | -------- |
| 继续依赖 `bun run smoke`       | 简单，已有路径                             | 无任务矩阵、无 per-check scoring、无 report schema        | 不足够   |
| 直接接入 OpenHands benchmarks  | 行业相关、任务丰富                         | 依赖和运行成本高，无法先验证本项目 trace scorer           | later    |
| Aider-style leaderboard        | 指标完整、容易理解                         | 会引入排名和模型比较语义，偏离 release core question      | 拒绝     |
| LLM judge                      | 可评估自然语言质量                         | 不确定性高，第一版会降低 regression signal 的可复现性     | 暂不采用 |
| Deterministic local harness    | 与现有 trace/smoke/tests 对齐              | 覆盖范围小，不能证明 live model 表现                      | 推荐     |
| JSON + Markdown only reports   | 实现简单，已有规划                         | reviewer 需要在长表格和失败证据间手工跳转，缺少过滤和折叠 | 不足够   |
| JSON + Markdown + HTML reports | 同时满足机器契约、文本审查和本地可浏览报告 | 需要额外布局、转义和浏览器验证，但不扩大到 dashboard      | 推荐     |

## 取舍矩阵

| 决策维度       | Deterministic local harness | External benchmark first | LLM judge first |
| -------------- | --------------------------- | ------------------------ | --------------- |
| 可复现性       | 高                          | 中                       | 低              |
| v0.3 scope fit | 高                          | 低                       | 低              |
| 实现成本       | 中                          | 高                       | 中              |
| 回归定位       | 高                          | 中                       | 低              |
| 行业可比性     | 中                          | 高                       | 中              |
| 安全边界清晰度 | 高                          | 中                       | 低              |

## 本项目约束

- `packages/core` 不能接收 provider-specific SDK shapes。
- TUI business logic 不能进入 `packages/core`。
- command execution 只能位于 approved command tool 或 scripts 中。
- safety 必须通过代码和 tests enforce，不能只靠 prompt。
- release docs、research、spec、checklist 使用中文正文。
- 未运行的 E2E、benchmark 或 quality gate 必须标为未运行。
- v0.3 不改变产品运行时代码，直到 implementation 明确批准。

## 建议

v0.3 采用 deterministic local Evaluation Harness：

1. 定义小型固定 task set，而不是外部 benchmark dataset。
2. 使用 deterministic providers，让结果可复现。
3. 复用 real tool registry、permission gate、JSONL event logger 和 fixture repos。
4. scorer 从 trace 和 worktree evidence 计算 deterministic pass/fail。
5. report 输出 JSON、Markdown 和 self-contained HTML，记录 evidence paths、limitations 和 not-run fields。
6. HTML report 渲染同一 JSON 数据模型，提供 summary、task matrix、failed checks、evidence links、limitations、filter/collapse 等本地审查能力。
7. live provider comparison、OpenHands benchmark import 和 LLM judge 放到 later scope。

## 影响的验收标准

- v0.3 release contract 必须新增 task pass rate、trace parse rate、safety denial rate、report completeness。
- v0.3 report completeness 必须覆盖 JSON、Markdown 和 HTML 三种本地 artifact；HTML 只证明可审查性，不代表线上 dashboard。
- testing strategy 后续实现时需要新增 Eval Harness 层级，位于 smoke 和 benchmark release evidence 之间。
- release note 后续必须报告本地 eval 真实结果，不能把 planned benchmark 写成 pass。

## 未决问题

- eval command 命名使用 `bun run eval`、`bun run eval:v0.3` 还是独立 `scripts/evaluate.ts`？
- JSON report schema 是否在 v0.3 立即公开为稳定 contract，还是标记为 internal v1？
- Markdown report 是否写入 `.agent-harness/evals/<runId>/report.md`，还是允许 `--out` 指定？
- HTML report 是否默认生成，还是只在 `--format html` / `--html` 明确请求时生成？
- HTML report 需要哪一级浏览器验证：只检查 `<!doctype html>` 和核心内容，还是用 browser smoke 验证移动宽度与交互控件？
- 是否在 v0.3 结束时把 eval 命令接入 `bun run quality`，还是先作为 release readiness gate 单独运行？
