# ADR-0001：Terminal-first TUI

## 状态

已接受

## 背景

项目需要可 review、可 revisit 的显式 architecture decisions。

## 决策

v0.1 使用 terminal-first Ink TUI，因为 coding agents 主要是 developer tools，并且需要可见的 event/permission state。

## 已考虑的备选方案

- 什么都不做，依赖 ad hoc convention。
- 只在 prompts 中编码该决策。
- 在 ADR 中记录该决策。

## 取舍

Pros：

- decision 可审计；
- future contributors 能理解项目为什么这样成形；
- release scope 保持稳定。

Cons：

- 增加 documentation overhead；
- stale ADRs 必须维护。

## 复审条件

当相关 release scope 改变，或 implementation evidence 与该决策冲突时 revisit。
