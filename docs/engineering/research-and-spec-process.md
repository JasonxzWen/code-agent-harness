# Research 和 Spec 流程

Research notes 和 specs 用于让设计决策显式、可复现、可 review。新增 release-facing 文档从 `v0.2.0` 起默认使用中文正文。

## Research note

路径：

```txt
docs/research/<release>/<topic>.md
```

模板：

```md
# 调研：<主题>

## 问题

## Release 相关性

## 已检查来源

## Industry scan

## Industry practice

## 备选方案

## Trade-off matrix

## 项目约束

## 建议

## 受影响的验收标准

## Open questions
```

Release work 必须包含 `Industry scan`。该段必须列出本次 release 决策检查过的主流产品或项目。至少从 OpenAI Codex、Claude Code 和 opencode 开始，并按 release 相关性补充 Aider、OpenHands、OpenClaw、Hermes Agent 等 peers。每个 source 都要记录对本项目的 decision signal，而不只是放一个链接。

## Spec

路径：

```txt
docs/specs/<release>/<topic>.md
```

模板：

```md
# 规格：<主题>

## Scope 分类

## 问题

## 用户可见行为

## 内部设计

## APIs / contracts

## Data / state model

## Error handling

## Permission / security considerations

## Testing plan

## E2E acceptance plan

## Benchmark plan

## Documentation impact

## Acceptance criteria

## Non-goals

## Rollout plan
```

## Alignment brief

Implementation 前提供简短 brief：

```md
## Alignment Brief

### Problem

### Why now

### Options considered

### Recommended decision

### Trade-offs

### Implementation plan

### Acceptance criteria
```

brief 应给出默认建议，而不是只提出开放式设计问题。Release work 的 brief 必须说明刷新了哪些 industry scan，以及这些发现如何影响推荐方案。

每个 user-visible feature 还必须说明 planned E2E acceptance scenario 和 benchmark question。
