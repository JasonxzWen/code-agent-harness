# Acceptance Criteria

Acceptance criteria are defined across five areas.

## Functional

- CLI starts.
- User can submit a task.
- Agent creates a run ID.
- Provider receives messages and tools.
- Tool calls normalize into internal calls.
- Tool inputs validate through schemas.
- Safe repo files can be listed/read/searched.
- Git status works read-only.
- Restricted command execution requests permission.
- Final answer cites inspected paths.
- JSONL trace is written.
- Run can be aborted.

## Safety

- Path traversal is blocked.
- Symlink escape is blocked.
- Secret files are denied.
- Binary files are denied.
- Destructive commands are denied.
- Output is bounded and truncation is explicit.
- No write-capable tool exists in v0.1.
- Logs do not include secrets or API keys.

## Engineering

- strict typecheck passes;
- lint passes;
- format check passes;
- build passes;
- tests pass;
- smoke passes;
- package boundaries hold;
- schemas exist for config/tool/event contracts.

## Documentation

- README complete;
- charter complete;
- roadmap complete;
- v0.1 architecture complete;
- ADRs complete;
- release note complete;
- testing strategy complete;
- tool and permission docs complete.

## Release

Do not release unless:

```txt
[ ] scope matches release contract
[ ] no v0.2+ feature slipped in
[ ] quality gate passes
[ ] build passes
[ ] smoke test passes
[ ] README updated
[ ] CHANGELOG updated
[ ] release note written
[ ] known limitations documented
```
