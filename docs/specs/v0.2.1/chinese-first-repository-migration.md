# 规格：Chinese-first Repository Migration

## Scope classification 分类

`later release`。`v0.2.1` 是文档、流程和源码可读性 release，不改变 agent loop、tool calling、provider、patch tool、TUI、MCP、sandbox、subagents 或 IDE extension 的运行时行为。

## 问题

当前仓库已经开始要求新增 release-facing docs 使用中文正文，但语言规则分散，且 README、CHANGELOG、AGENTS、skills、templates、engineering docs、历史 ADR/research/spec 的迁移边界不清晰。后续 agent session 可能继续产出英文规范或用英文汇报，从而削弱仓库的中文优先目标。

## 用户可见行为

后续仓库迭代默认表现为：

- 用户请求、agent updates、final report 默认中文。
- 新增 release contract、research、spec、checklist、ADR、engineering docs、skills 文档正文默认中文。
- review handoff 使用中文解释 what/why/how，保留表格列名或代码标识符原文时不视为违反规则。
- 核心源码注释默认中文，使用 UTF-8，解释 what、why、how。
- 代码标识符、命令、包名、路径、API、外部项目名、引用标题保留原文。

## 内部设计

### 文档清单与分类

| Category                | 当前路径                                                                                                             | 迁移要求                                                                     |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| release docs            | `docs/releases/*.md`                                                                                                 | 全部迁移为中文优先正文；release name、命令、路径和已运行证据保持原文或原意。 |
| research/spec/ADR       | `docs/research/**`, `docs/specs/**`, `docs/adr/**`                                                                   | 全部迁移为中文优先正文；source titles、外部项目名、技术标识保留原文。        |
| engineering standards   | `docs/engineering/*.md`                                                                                              | 全部迁移或原本已中文；继续作为后续中文迭代入口。                             |
| checklists              | `docs/checklists/*.md`                                                                                               | 全部迁移为中文优先正文；checkbox label 和技术 evidence 可保留英文标识。      |
| agent docs              | `docs/agent/*.md`, `docs/architecture/*.md`                                                                          | 全部迁移为中文优先正文；interface、JSON、tool/event name 保留原文。          |
| templates               | `docs/templates/*.md`                                                                                                | 第一批已迁移，确保新文档从模板开始中文。                                     |
| skills                  | `.agents/skills/*/SKILL.md`                                                                                          | 已迁移为中文优先正文；后续新增 skills 继续遵守语言政策。                     |
| README/CHANGELOG/AGENTS | `README.md`, `CHANGELOG.md`, `AGENTS.md`                                                                             | 全部迁移为中文优先正文。                                                     |
| auxiliary docs          | `.codex/hooks/README.md`, `MANIFEST.md`, `scripts/ralph/CODEX.md`, fixture README                                    | 全部迁移为中文优先正文。                                                     |
| source comments         | `apps/cli/src/**`, `packages/core/src/**`, `packages/tools/src/**`, `packages/providers/src/**`, `scripts/smoke*.ts` | 核心逻辑补充中文 what/why/how 注释；UTF-8 编码；不改变运行时行为。           |

### 中文优先规则

必须使用中文正文：

- release note、release contract、readiness checklist；
- research note、spec、ADR；
- engineering standards、testing strategy、acceptance、benchmark、code review process 等工程文档；
- skills 文档、agent docs、README、CHANGELOG、AGENTS 中的用户可读说明；
- final report、review handoff、自检和人工验收记录。
- 核心源码中解释运行路径、安全边界、跨包契约和 E2E path 的注释。

允许保留英文：

- TypeScript 标识符、函数名、类型名、event name、tool name；
- 命令、参数、路径、文件名、包名、环境变量；
- API 名称、SDK 名称、协议名称、schema 字段；
- 外部项目名、官方页面标题、论文标题、引用标题；
- Markdown frontmatter keys、JSON/YAML/TOML keys 等结构化键名。

优先中文但可保留必要英文：

- Mermaid 图中的用户可读节点优先中文；代码符号节点保持原文。
- 表格字段优先中文；涉及接口字段、metric name、command name 的列可保留英文。
- benchmark question 和 metric 可中文描述，metric identifier 可英文。

暂缓迁移：

- 自动语言扫描脚本；
- 第三方引用标题和外部项目 README 摘录；
- 多语言文档站点或翻译流水线；
- 运行时代码中的英文标识；源码注释已纳入本 release 的可读性需求。

## APIs / Contracts 契约

本 release 不新增运行时 API。新增或更新的文档契约为：

- `docs/engineering/language-policy.md` 是中文优先语言政策的权威入口。
- `AGENTS.md` 必须链接语言政策并要求中文回复。
- `docs/engineering/standards.md` 和 `docs/engineering/release-documentation-standard.md` 必须引用语言政策。
- `.agents/skills/*/SKILL.md` 必须在执行本仓库任务时遵守中文优先政策。
- 核心源码注释遵守 `docs/engineering/standards.md` 的源码注释和编码标准。

## 数据 / 状态模型

迁移状态通过 checklist 和 future audit 记录，不引入数据库或状态文件：

| State             | Meaning                                                  |
| ----------------- | -------------------------------------------------------- |
| `not-audited`     | 尚未检查语言状态。                                       |
| `policy-covered`  | 已有中文优先规则或引用，但正文可能未迁移。               |
| `needs-migration` | 已发现英文正文，需要后续迁移。                           |
| `deferred`        | 明确暂缓，且有原因。                                     |
| `done`            | 正文中文化完成，保护项未误翻译。                         |
| `commented`       | 核心源码已有中文 what/why/how 注释，且未改变运行时行为。 |

## 错误处理

文档迁移错误按人工 review 和 checklist 处理：

- 发现代码符号被误翻译：标记 blocker，恢复原文符号。
- Markdown 表格、Mermaid 或命令块损坏：标记 blocker，修复格式后重新跑 format check。
- 未运行验收却写成通过：标记 release blocker，改为 `not run` 或补跑证据。
- 历史文档语义不确定：暂缓全文翻译，添加中文摘要或 reviewer note。
- 注释与代码行为不一致：标记 blocker，修正注释或代码；不能让注释解释不存在的行为。

## Permission / Security 考量

- 不修改产品权限模型。
- 不改变产品运行时行为；源码注释只能解释现有逻辑。
- 不引入机器翻译服务或外部 API key。
- 不批量改写含安全策略、secret policy、permission policy 的历史文档，避免误改安全语义。
- 命令块和路径必须保持可复制执行，不因中文化改变语义。

## 测试计划

本阶段只做文档和规范更新。测试计划：

- `bun run format:check`
- `bun run lint`
- `bun run typecheck`
- `bun run build`
- `bun run test`
- `bun run smoke`
- `bun run quality`
- 人工抽查核心源码中文注释，确认 UTF-8、what/why/how 和无 runtime diff。

如果后续实现自动文档语言扫描脚本，再新增：

- 中文正文比例扫描；
- 英文正文白名单；
- Markdown link/path check；
- Mermaid syntax check；
- command block preservation check。

## E2E 验收计划

场景：新会话中文优先规则发现。

步骤：

1. 从仓库根目录启动新 agent session。
2. 读取 `AGENTS.md`。
3. 读取 `docs/engineering/language-policy.md`、`docs/engineering/standards.md`、`docs/engineering/release-documentation-standard.md`。
4. 要求 agent 规划下一次 release 文档。
5. 验收 agent 输出是否默认中文，并正确保留代码标识符、命令、路径、包名、外部项目名和引用标题。

预期证据：

- agent 能说明必须中文的文档类别；
- agent 能说明允许英文的技术标识；
- agent 能拒绝未批准的大规模批量翻译；
- agent 能给出中文 release contract/spec/checklist 的下一步。

## Benchmark 计划

Benchmark question：仓库是否已经具备可审计的中文优先迁移路径，并能量化剩余迁移工作？

| Metric 指标          | Definition 定义                          | Manual audit method                                             | Target 目标   |
| -------------------- | ---------------------------------------- | --------------------------------------------------------------- | ------------- |
| 入口覆盖率           | 关键入口中引用中文优先政策的比例         | 检查 `AGENTS.md`、engineering docs、skills                      | 100%          |
| 新增规划文档中文比例 | v0.2.1 新增文档正文中文段落比例          | 人工抽查正文段落                                                | 100%          |
| 分类覆盖率           | gap list 是否覆盖全部文档类别            | 对照 `rg --files docs .agents AGENTS.md README.md CHANGELOG.md` | 100% 类别覆盖 |
| 保护项误翻译数       | 命令、路径、API、代码标识符被翻译的数量  | 抽查表格、命令块、Mermaid、链接                                 | 0             |
| 剩余英文正文清单     | 是否列出未迁移的主要英文正文类别         | checklist audit                                                 | 必须存在      |
| 核心注释覆盖率       | 核心源码路径是否有中文 what/why/how 注释 | 人工抽查 agent loop、tools、provider、CLI、smoke path           | 核心路径 100% |
| 自动语言扫描         | 是否存在可重复运行的启发式扫描命令       | 运行 `bun run audit:language`                                   | 0 blocker     |

`bun run audit:language` 是 v0.2.1 的独立 release readiness gate。第一版不接入 `bun run quality` 或 CI；待误报和 allowlist 校准后，再把它升级为 blocking quality/CI gate。结果应记录为 manual audit、heuristic audit 或 planned automation，不得写成 executed comparison。

## 文档影响

新增：

- `docs/releases/v0.2.1-contract.md`
- `docs/research/v0.2.1/chinese-first-repository-migration.md`
- `docs/specs/v0.2.1/chinese-first-repository-migration.md`
- `docs/checklists/v0.2.1-readiness-gap-list.md`
- `docs/engineering/language-policy.md`

更新：

- `AGENTS.md`
- `docs/engineering/standards.md`
- `docs/engineering/release-documentation-standard.md`
- `.agents/skills/research-spec/SKILL.md`
- `.agents/skills/implementation-quality/SKILL.md`
- `.agents/skills/release-readiness/SKILL.md`
- `package.json`
- `scripts/audit-language.ts`
- 核心源码注释：`packages/core/src/**`、`packages/tools/src/**`、`packages/providers/src/**`、`apps/cli/src/**`、`scripts/smoke*.ts`

## 验收标准

- 所有新增 v0.2.1 规划文档正文为中文。
- 文档分类、迁移顺序、风险控制、验收机制、E2E 和 benchmark plan 已定义。
- 根指令和 engineering docs 能让后续会话明确中文优先。
- readiness checklist 标出迁移前、中、后的 blockers、证据和验收项。
- 核心源码中文注释覆盖主要 what/why/how 路径，UTF-8 编码，不改变运行时行为。
- `bun run audit:language` 可重复运行，并将明显英文正文残留和核心源码注释缺口报告为 blocker。

## 非目标

- 不改变产品功能代码行为；允许注释级源码可读性改动。
- 不新增 UI、provider、patch tool、MCP、sandbox、subagents、IDE extension。
- 不建立自动翻译或多语言站点。
- 不伪造未运行的验收或 benchmark。

## Rollout 计划

1. `v0.2.1 planning`：完成 contract、research、spec、checklist、language policy 和入口引用。当前状态：done。
2. `template pass`：迁移 `docs/templates/*`，让新文档默认中文。当前状态：done。
3. `release-facing pass`：迁移 README、CHANGELOG、AGENTS.md 和 release docs。当前状态：done。
4. `skills pass`：迁移 `.agents/skills/*/SKILL.md`。当前状态：done。
5. `engineering pass`：迁移 lifecycle、testing、acceptance、benchmark、code review 等 engineering docs。当前状态：done。
6. `agent/tool pass`：迁移 docs/agent、docs/architecture。当前状态：done。
7. `history pass`：迁移历史 ADR/research/spec、release docs 和 checklists，并记录允许保留英文项。当前状态：done。
8. `auxiliary pass`：迁移 `.codex/hooks/README.md`、`MANIFEST.md`、`scripts/ralph/CODEX.md` 和 fixture README。当前状态：done。
9. `source comment pass`：为核心逻辑补充中文 what/why/how 注释，并确认 UTF-8 编码。当前状态：done。
10. `language audit pass`：实现 `bun run audit:language`，扫描 Markdown 英文正文残留和核心源码中文 what/why/how 注释。当前状态：done；该命令作为独立 release readiness gate，暂不接入 `bun run quality` 或 CI。
11. `automation pass`：后续校准 allowlist，并评估是否把语言扫描、链接/路径检查和 markdown/mermaid 验证接入 `bun run quality` 和 CI。当前状态：planned。
