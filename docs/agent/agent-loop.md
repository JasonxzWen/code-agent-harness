# Agent Loop

## 流程

```txt
start run
→ build messages
→ call provider
→ normalize response
→ if tool call:
     validate args
     check permission
     execute tool
     append result
     log event
     continue
→ if final:
     log final
     render answer
     stop
```

## 限制

| 限制项                       | 默认值 |
| ---------------------------- | -----: |
| max steps                    |      8 |
| 每步最多 tool calls          |      4 |
| repeated validation failures |      2 |
| provider timeout             |    60s |
| command timeout              |    20s |

## 终止条件

| 条件               | 结果                                  |
| ------------------ | ------------------------------------- |
| final answer       | done                                  |
| max steps exceeded | error                                 |
| unknown tool       | error                                 |
| invalid args       | 返回 validation result 并在限制内重试 |
| permission denied  | 返回 denied result                    |
| user abort         | aborted                               |
