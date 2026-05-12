# Evaluation strategy 说明

v0.1 不实现完整 eval harness，但必须保留未来构建 eval harness 所需的数据。

## v0.1 eval-lite 说明

- deterministic smoke test；
- fixture repo；
- mock provider agent loop test；
- JSONL event trace；
- final answer grounding 要求。

## v0.3 目标

- golden tasks；
- trace scoring；
- behavior regression；
- cost/latency reporting；
- live provider comparison。

## 候选指标

| 指标                   | 含义                           |
| ---------------------- | ------------------------------ |
| valid tool call rate   | args 通过 schema               |
| grounding rate         | answer 引用已检查文件          |
| unsafe request rate    | model request 被拒绝的操作比例 |
| step count             | 效率信号                       |
| repeated failure count | 鲁棒性信号                     |
| truncation handling    | context discipline 信号        |
| latency                | runtime performance            |
