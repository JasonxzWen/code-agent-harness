# HTML 工作汇报模式

## 静态报告边界

HTML 工作汇报是本地审查 artifact，不是产品 UI、dashboard、托管服务或 PR 描述。默认输出一个 self-contained `.html` 文件，主阅读内容必须在离线浏览器中可见。

推荐边界：

- JSON 输入是生成契约，HTML 是人类审查视图。
- 生成器可以根据 JSON 渲染 Markdown、Mermaid、code、diff、evidence、verification 和 next actions。
- HTML 不重新计算 pass/fail，不隐藏 JSON 或 chat final report 中的失败项。
- 不引入 React、Tailwind、Vite 或打包步骤；复杂产品 UI 应转向专门的 frontend skill。

## 报告结构

每份报告至少包含：

- 结论摘要：状态、目标、scope、最重要风险、下一步。
- 变更点或发现：what、why、how、review focus。
- 证据：repo-relative `file:line`、代码片段、diff、命令、artifact、来源或截图说明。
- 验证：已运行命令、真实结果、未运行项、降级原因。
- 限制：known limitations、residual risk、需要人工确认的问题。

## 模板使用

| 模板                     | 使用场景                         | 关键内容                                                 |
| ------------------------ | -------------------------------- | -------------------------------------------------------- |
| `implementation-handoff` | 完成实现或多文件变更后交接       | 变更点、文件证据、quality gates、risks、next actions     |
| `review-findings`        | 审查结果或 PR 风险报告           | severity、owner、finding、source snippet、action export  |
| `research-explainer`     | 调研、架构理解、模块 walkthrough | sources、decision signal、diagram、open questions        |
| `decision-matrix`        | 多方案比较                       | options、trade-offs、recommendation、risks、confirmation |
| `conclusion-dashboard`   | release readiness 或状态看板     | completion、verification、blockers、summary metrics      |

## 证据写法

代码证据必须让 reviewer 不读完整 diff 也能理解重点：

- 使用 repo-relative path，不写本机绝对路径。
- 标注 `file:line`，必要时标注 start/end line。
- 复制决定性代码片段或 diff，并高亮关键行。
- 对风险解释 why this matters，而不是只贴路径。
- 对生成物、trace、report、screenshot 等 evidence，说明它证明了什么。

## Rich content

默认使用 `pre-rendered`：

- Markdown 渲染成 semantic HTML。
- Mermaid 渲染成 inline SVG，并保留 source fallback。
- Code 渲染成静态 highlighting。
- Diff 渲染成 inert added/removed lines。

只有在用户明确要求可编辑或运行时增强时才使用 `runtime`。runtime mode 必须声明 pinned 依赖并保留 source fallback：

- `marked@18.0.3`
- `DOMPurify@3.4.2`
- `mermaid@11.15.0`
- `@highlightjs/cdn-assets@11.11.1`

## 安全和隐私

- 对混合信任内容做 escaping/sanitization。
- 删除或转义 `<script>`、event handler、`javascript:` 等危险内容。
- code snippet、diff、trace excerpt 和 path 默认 inert。
- 不写 secret、token-looking value、用户主目录、系统用户名、本机私有绝对路径或无关机器信息。
- 如果报告需要引用外部来源，优先使用明确的 `https://` source link，并在正文中标注来源用途。

## 校验规则

使用 `scripts/validate-html-report.mjs` 检查：

- `data-html-work-report` root 存在；
- primary content 非空；
- Markdown/Mermaid/code/diff 已渲染或有 runtime fallback；
- evidence 和 verification section 存在；
- filters、tabs、copy controls 等交互控件存在；
- `prefers-reduced-motion` 支持存在；
- 默认报告没有 CDN 依赖；
- browser smoke 已通过，或降级原因已记录。

浏览器不可用时可以降级，但报告不能把降级写成通过。
