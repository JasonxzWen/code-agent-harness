# Research source policy

本政策约束 `docs/research/`、release specs、release contracts、readiness checklists 和 HTML handoff reports 中关于外部 coding agent 产品的写法。

调研刷新日期：2026-05-14。

## 允许来源

优先使用以下来源：

- 官方文档，例如 OpenAI Developers、Claude Code Docs、opencode docs。
- 官方源码或官方仓库 README，例如公开 GitHub organization 下的项目源码。
- 官方 release notes、changelog、feature maturity 或 migration guide。
- 标准文档，例如 [AGENTS.md](https://agents.md/) 或 Git / POSIX / JSON Schema 等标准。
- 可信工程文章，例如产品方工程团队、maintainer-authored 技术博客或公开设计说明。

不使用以下来源作为事实基础：

- 未溯源的社交媒体摘要；
- 二手营销稿；
- 论坛猜测；
- 反编译、泄漏、prompt dump 或未授权内部材料；
- 无法复查的个人截图；
- 将模型回答本身当作事实来源。

## 三类陈述

每个外部机制描述必须能落入以下三类之一。

| 类型                    | 可以写什么                                                 | 不能写什么                                  |
| ----------------------- | ---------------------------------------------------------- | ------------------------------------------- |
| `observation`           | 官方文档或可观察产品行为明确描述的事实。                   | 推断产品内部如何调度、排序、压缩或训练。    |
| `inference`             | 基于 observation 的设计推断，并明确写成推断。              | 把推断写成闭源产品内部实现事实。            |
| `implementation target` | 本项目准备复现的最小抽象、trace、policy、fixture 或 eval。 | 声称本项目已经实现尚未落地的 runtime 能力。 |

推荐句式：

- `公开文档显示 ...`
- `可观察行为是 ...`
- `本项目的设计推断是 ...`
- `本项目将复现的不是产品内部实现，而是 ...`
- `当前状态：needs verification`。

## release spec 前刷新要求

每次开始 release spec 前必须执行一次相关 research refresh：

1. 明确 release 机制，例如 `scoped memory`、`subagents`、`hooks` 或 `sandbox-lite`。
2. 重新检查 Codex、Claude Code、opencode 和 release-relevant peers 的官方资料。
3. 更新对应 research 文档的 `调研刷新日期`、来源列表和 changed observations。
4. 将 observation 映射到本 release scope；不因外部产品能力存在而扩大本 release。
5. 在 spec 中链接 research 文档，并标明哪些内容是 implementation target，哪些是 later / non-goal。

## 闭源产品写作禁区

禁止写：

- `Claude Code 内部通过 X 算法实现 memory ranking`，除非官方文档明确这样写。
- `Codex 的 subagent scheduler 使用 Y 队列`，除非公开源码或官方文档明确这样写。
- `某产品会偷读所有文件`，除非官方安全文档或可复现实验支持。
- `memory proposal 已实现`，除非官方文档或本项目代码验证支持。

可写：

- `Claude Code docs 描述 agent teams 有 team lead、teammates、task list 和 mailbox；本项目将把这些作为 v0.6 的可观察抽象。`
- `Codex docs 描述 skills 使用 progressive disclosure；本项目 v0.7 将复现 metadata-first discovery 和 explicit load trace。`
- `当前是否已有 memory proposal UI contract：needs verification。`

## source table 格式

每篇 research 文档应包含来源表：

| Source             | Type                                                                    | Used for                             |
| ------------------ | ----------------------------------------------------------------------- | ------------------------------------ |
| `URL or repo path` | official docs / source / release notes / standard / engineering article | 一句话说明用于支撑哪类 observation。 |

## 本项目状态写法

- 已实现能力必须能指向 `packages/`、`apps/`、`scripts/`、`docs/specs/` 或运行证据。
- 未实现能力写为 `planned`、`not implemented`、`later` 或 `needs verification`。
- 文档-only release 可以新增 research、spec、matrix 和 HTML handoff report，但不得把这些文档写成 runtime behavior。
- Quality gates 必须如实记录。未运行的 gate 写 `not run`，不能推断为通过。
