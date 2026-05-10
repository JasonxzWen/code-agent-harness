#!/usr/bin/env python3
"""Narrow PreToolUse guardrail for Codex.

Blocks a small set of clearly dangerous operations and writes to protected files.
Command approvals, workflow discipline, and quality gates live outside this hook.
"""

import json
import re
import sys

DANGEROUS_COMMAND_PATTERNS = [
    (
        r"\bgit\s+reset\s+--hard\b",
        "git reset --hard discards local work.",
    ),
    (
        r"\brm\s+-[^\s;]*r[^\s;]*f[^\s;]*\s+(?:/|~|\.{1,2})(?:\s|$)",
        "recursive forced deletion targets a root or broad relative path.",
    ),
    (
        r"\brm\s+-[^\s;]*r[^\s;]*f[^\s;]*\s+.*(?:^|[/\\])\.git(?:[/\\]|\s|$)",
        "recursive forced deletion targets .git.",
    ),
    (
        r"\bRemove-Item\b(?=.*\b-Recurse\b)(?=.*\b-Force\b).*\.git(?:[/\\]|\s|$)",
        "recursive forced deletion targets .git.",
    ),
]

PROTECTED_PATH_PATTERNS = [
    r"(^|[\s\"'/\\])\.env(\.|$|[\s\"'/\\])",
    r"(^|[\s\"'/\\])id_rsa($|[\s\"'/\\])",
    r"(^|[\s\"'/\\])id_ed25519($|[\s\"'/\\])",
    r"\.pem(\.|$|[\s\"'/\\])",
    r"\.key(\.|$|[\s\"'/\\])",
    r"(^|[\s\"'/\\])\.git($|/|\\)",
]


def dangerous_command_reason(command: str) -> str | None:
    for pattern, reason in DANGEROUS_COMMAND_PATTERNS:
        if re.search(pattern, command, flags=re.IGNORECASE):
            return reason

    for match in re.finditer(r"\bgit\s+clean\s+(-[A-Za-z]+)\b", command, flags=re.IGNORECASE):
        flags = match.group(1).lower()
        if "f" in flags and ("d" in flags or "x" in flags):
            return "git clean with force and directory/ignored-file flags can remove generated and untracked work."

    return None


def deny(reason: str) -> None:
    print(json.dumps({
        "hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "permissionDecision": "deny",
            "permissionDecisionReason": reason,
        }
    }))
    sys.exit(0)


def main() -> None:
    try:
        event = json.loads(sys.stdin.read().lstrip("\ufeff") or "{}")
    except Exception:
        return

    tool_name = event.get("tool_name", "")
    tool_input = event.get("tool_input", {}) or {}

    if tool_name == "Bash":
        command = str(tool_input.get("command", ""))
        reason = dangerous_command_reason(command)
        if reason:
            deny(f"Blocked by dangerous operation guard: {reason}")

    if tool_name in {"apply_patch", "Edit", "Write"}:
        raw = json.dumps(tool_input)
        for pattern in PROTECTED_PATH_PATTERNS:
            if re.search(pattern, raw):
                deny(f"Blocked by dangerous operation guard: protected path matches `{pattern}`.")

    return


if __name__ == "__main__":
    main()
