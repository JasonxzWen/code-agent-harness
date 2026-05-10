# Agent Loop

## Flow

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

## Limits

| Limit                        | Default |
| ---------------------------- | ------: |
| max steps                    |       8 |
| max tool calls per step      |       4 |
| repeated validation failures |       2 |
| provider timeout             |     60s |
| command timeout              |     20s |

## Termination

| Condition          | Result                                       |
| ------------------ | -------------------------------------------- |
| final answer       | done                                         |
| max steps exceeded | error                                        |
| unknown tool       | error                                        |
| invalid args       | return validation result, retry within limit |
| permission denied  | return denied result                         |
| user abort         | aborted                                      |
