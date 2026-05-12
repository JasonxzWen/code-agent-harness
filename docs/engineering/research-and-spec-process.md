# Research 和 Spec 流程

Research notes 和 specs 用于让设计决策显式、可复现、可 review。新增 release-facing 文档从 `v0.2.0` 起默认使用中文正文。

## Research note 模板

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

## 行业扫描

## 行业实践

## 备选方案

## 取舍矩阵

## 项目约束

## 建议

## 受影响的验收标准

## 开放问题
```

Release work 必须包含 `Industry scan`。该段必须列出本次 release 决策检查过的主流产品或项目。至少从 OpenAI Codex、Claude Code 和 opencode 开始，并按 release 相关性补充 Aider、OpenHands、OpenClaw、Hermes Agent 等 peers。每个 source 都要记录对本项目的 decision signal，而不只是放一个链接。

## Spec 模板

路径：

```txt
docs/specs/<release>/<topic>.md
```

模板：

```md
# 规格：<主题>

## Scope classification 分类

## 问题

## 用户可见行为

## 内部设计

## APIs / contracts 契约

## 数据 / 状态模型

## 错误处理

## Permission / security 考量

## 测试计划

## E2E 验收计划

## Benchmark 计划

## 文档影响

## 验收标准

## 非目标

## Rollout 计划
```

## Alignment brief 模板

Implementation 前提供简短 brief：

```md
## Alignment brief

### 问题

### 为什么现在处理

### 已考虑选项

### 建议决策

### 取舍

### 实施计划

### 验收标准
```

brief 应给出默认建议，而不是只提出开放式设计问题。Release work 的 brief 必须说明刷新了哪些 industry scan，以及这些发现如何影响推荐方案。

每个 user-visible feature 还必须说明 planned E2E acceptance scenario 和 benchmark question。
