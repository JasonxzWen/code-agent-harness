# Context Engineering

## v0.1 strategy

v0.1 uses tool-driven repository inspection instead of preloading the repository.

```txt
system prompt
+ user task
+ tool definitions
+ bounded tool results
+ final answer instruction
```

## Why not embeddings in v0.1

Embeddings add indexing, storage, freshness, ranking, and evaluation complexity. v0.1 first validates the agent loop and tool protocol.

## Output grounding

Final answers should mention inspected files by path.

Example:

```txt
Inspected:
- package.json
- README.md
- src/index.ts
```

## Future

| Release | Capability                             |
| ------- | -------------------------------------- |
| v0.1    | tool-driven inspection                 |
| v0.3    | trace-informed eval                    |
| v0.4    | repo map, file ranking, context budget |
| v0.6    | visible memory-aware context           |
