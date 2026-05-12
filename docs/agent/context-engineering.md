# Context engineering 说明

## v0.1 策略

v0.1 使用 tool-driven repository inspection，而不是预加载整个 repository。

```txt
system prompt
+ user task
+ tool definitions
+ bounded tool results
+ final answer instruction
```

## 为什么 v0.1 不使用 embeddings

Embeddings 会增加 indexing、storage、freshness、ranking 和 evaluation complexity。v0.1 先验证 agent loop 和 tool protocol。

## 输出 grounding

Final answers 应按 path 提及已 inspect 的 files。

示例：

```txt
Inspected:
- package.json
- README.md
- src/index.ts
```

## 后续方向

| Release | 能力                                        |
| ------- | ------------------------------------------- |
| v0.1    | tool-driven inspection                      |
| v0.3    | trace-informed eval                         |
| v0.4    | repo map、file ranking、context budget 能力 |
| v0.6    | visible memory-aware context                |
