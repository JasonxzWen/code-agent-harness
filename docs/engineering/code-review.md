# Code Review Standard

Use this for human review, AI self-review, and Codex `/review` guidance.

## Findings first

Review output should lead with findings, ordered by severity.

Each finding should include:

- file path;
- line or symbol when possible;
- risk;
- concrete fix direction;
- test gap if relevant.

## Review categories

| Category     | Check                                           |
| ------------ | ----------------------------------------------- |
| Scope        | matches release contract                        |
| Architecture | package boundaries preserved                    |
| Safety       | path/secret/command/permission policy preserved |
| Types        | no unvalidated external input                   |
| Provider     | provider-specific shapes do not leak into core  |
| Tools        | input/output schemas and errors are structured  |
| Tests        | success and failure paths covered               |
| Docs         | public behavior documented                      |
| DX           | commands and setup remain usable                |

## Non-findings

Avoid style-only comments unless they hide correctness, maintainability, or DX risk.

## No findings

If no findings are discovered, state that explicitly and mention residual testing gaps.
