# Code Review 标准

本标准适用于 human review、AI self-review 和 Codex `/review` guidance。

## Findings 优先

Review output 应以 findings 开头，并按 severity 排序。

每个 finding 应包含：

- file path；
- line 或 symbol，尽可能提供；
- risk；
- concrete fix direction；
- test gap，若相关。

## Review 分类

| Category     | Check                                      |
| ------------ | ------------------------------------------ |
| Scope        | 匹配 release contract                      |
| Architecture | package boundaries preserved               |
| Safety       | path/secret/command/permission policy 保持 |
| Types        | 无 unvalidated external input              |
| Provider     | provider-specific shapes 不泄漏到 core     |
| Tools        | input/output schemas 和 errors 结构化      |
| Tests        | success 和 failure paths 已覆盖            |
| Docs         | public behavior 已记录                     |
| DX           | commands 和 setup remain usable            |

## 非问题

避免只针对 style 发表评论，除非 style 问题隐藏 correctness、maintainability 或 DX risk。

## 无问题

如果没有发现 findings，必须明确说明，并提到剩余 testing gaps 或 residual risk。
