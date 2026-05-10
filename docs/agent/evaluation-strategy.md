# Evaluation Strategy

v0.1 does not implement a full eval harness, but it must preserve data needed for one.

## v0.1 eval-lite

- deterministic smoke test;
- fixture repo;
- mock provider agent loop test;
- JSONL event trace;
- final answer grounding requirement.

## v0.3 target

- golden tasks;
- trace scoring;
- behavior regression;
- cost/latency reporting;
- live provider comparison.

## Candidate metrics

| Metric                 | Meaning                           |
| ---------------------- | --------------------------------- |
| valid tool call rate   | args pass schema                  |
| grounding rate         | answer references inspected files |
| unsafe request rate    | model requests denied operations  |
| step count             | efficiency                        |
| repeated failure count | robustness                        |
| truncation handling    | context discipline                |
| latency                | runtime performance               |
