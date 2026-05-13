import { describe, expect, test } from "bun:test";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  assertNoReportPrivacyLeaks,
  escapeHtml,
  findReportPrivacyLeaks,
  getV03EvalTasks,
  parseJsonlTrace,
  parseReleaseLogMarkdown,
  redactReportPrivateText,
  renderHtmlReport,
  runEvaluation,
  type EvalReport
} from "./eval-harness";

describe("v0.3 eval harness", () => {
  test("defines the fixed P0 task matrix", () => {
    const tasks = getV03EvalTasks();

    expect(tasks.map((task) => task.id)).toEqual([
      "inspection-tiny-ts",
      "patch-approval-value",
      "patch-denial-no-write",
      "command-policy-denial"
    ]);
    expect(tasks.some((task) => task.category === "safety")).toBe(true);
  });

  test("runs the deterministic suite and writes JSON, Markdown, and HTML reports", async () => {
    const outputDir = await mkdtemp(path.join(tmpdir(), "agent-harness-eval-"));
    try {
      const report = await runEvaluation({
        outputDir
      });

      expect(report.totals.tasks).toBe(4);
      expect(report.totals.failed).toBe(0);
      expect(report.totals.errors).toBe(0);
      expect(report.metrics.traceParseRate).toBe(1);
      expect(report.metrics.safetyDenialRate).toBe(1);
      expect(report.outputDir).toBe("[external-output]");
      expect(report.reportPaths.html).toBe("[external-output]/report.html");
      expect(report.taskResults[0]?.tracePath).toBe(
        "[external-output]/traces/inspection-tiny-ts.jsonl"
      );
      expect(report.releaseLog.sourcePath).toBe("CHANGELOG.md");
      expect(report.releaseLog.totals.releases).toBeGreaterThan(0);
      expect(report.releaseLog.totals.items).toBeGreaterThan(0);
      expect(findReportPrivacyLeaks(report)).toEqual([]);

      const jsonPath = path.join(outputDir, "report.json");
      const markdownPath = path.join(outputDir, "report.md");
      const htmlPath = path.join(outputDir, "report.html");
      const jsonText = await readFile(jsonPath, "utf8");
      const json = JSON.parse(jsonText) as {
        schemaVersion: string;
      };
      expect(json.schemaVersion).toBe("eval-report.v1");
      const markdown = await readFile(markdownPath, "utf8");
      expect(markdown).toContain("任务矩阵");
      const html = await readFile(htmlPath, "utf8");
      expect(html).toContain("<!doctype html>");
      expect(html).toContain("statusFilter");
      expect(html).toContain("patch-denial-no-write");
      expect(html).toContain("releaseLog");
      expect(html).toContain("Release log 数据");
      assertNoReportPrivacyLeaks(jsonText);
      assertNoReportPrivacyLeaks(markdown);
      assertNoReportPrivacyLeaks(html);
    } finally {
      await rm(outputDir, { recursive: true, force: true });
    }
  }, 15000);

  test("reports JSONL parse errors with line numbers", async () => {
    const outputDir = await mkdtemp(path.join(tmpdir(), "agent-harness-trace-"));
    try {
      const tracePath = path.join(outputDir, "trace.jsonl");
      await writeFile(
        tracePath,
        [
          JSON.stringify({
            runId: "run-test",
            timestamp: new Date().toISOString(),
            type: "run.started",
            data: {}
          }),
          "{not-json}"
        ].join("\n")
      );

      const trace = await parseJsonlTrace(tracePath);
      expect(trace.events).toHaveLength(1);
      expect(trace.errors).toHaveLength(1);
      expect(trace.errors[0]?.line).toBe(2);
    } finally {
      await rm(outputDir, { recursive: true, force: true });
    }
  });

  test("parses CHANGELOG-style release log data for HTML reporting", () => {
    const releaseLog = parseReleaseLogMarkdown(
      [
        "# 变更日志",
        "",
        "## [Unreleased]",
        "",
        "### 新增",
        "",
        "- HTML release log",
        "- privacy scan",
        "",
        "## [0.1.0] - 2026-05-11",
        "",
        "### 新增",
        "",
        "- initial release"
      ].join("\n"),
      "CHANGELOG.md"
    );

    expect(releaseLog.sourcePath).toBe("CHANGELOG.md");
    expect(releaseLog.totals.releases).toBe(2);
    expect(releaseLog.totals.items).toBe(3);
    expect(releaseLog.totals.unreleasedItems).toBe(2);
    expect(releaseLog.entries[0]?.version).toBe("Unreleased");
    expect(releaseLog.entries[1]?.date).toBe("2026-05-11");
    expect(releaseLog.entries[0]?.sections[0]?.items).toEqual([
      "HTML release log",
      "privacy scan"
    ]);
  });

  test("escapes report content before rendering HTML", () => {
    expect(escapeHtml('<script>alert("x")</script>')).toBe(
      "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;"
    );

    const html = renderHtmlReport(createMinimalReport("<script>alert(1)</script>"));
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html).not.toContain("<script>alert(1)</script>");
  });

  test("redacts absolute paths, user homes, and token-looking values from report strings", () => {
    const text =
      "trace at C:\\Users\\Ada\\repo\\trace.jsonl and /home/ada/repo/report.html token sk-1234567890abcdef";

    const redacted = redactReportPrivateText(text);

    expect(redacted).toContain("[redacted-absolute-path]");
    expect(redacted).toContain("[redacted-user-path]");
    expect(redacted).toContain("[redacted-secret]");
    expect(findReportPrivacyLeaks(redacted)).toEqual([]);
    expect(findReportPrivacyLeaks(text).length).toBeGreaterThan(0);
  });
});

function createMinimalReport(finalAnswer: string): EvalReport {
  return {
    schemaVersion: "eval-report.v1",
    generatedAt: "2026-05-13T00:00:00.000Z",
    suiteId: "v0.3",
    gitHead: null,
    outputDir: "out",
    reportPaths: {
      json: "out/report.json",
      markdown: "out/report.md",
      html: "out/report.html"
    },
    taskResults: [
      {
        taskId: "escaping",
        title: "Escaping",
        category: "inspection",
        status: "pass",
        runId: "run-test",
        tracePath: "out/trace.jsonl",
        worktreePath: "out/worktree",
        checks: [
          {
            id: "final_answer",
            status: "pass",
            message: finalAnswer
          }
        ],
        metrics: {
          stepCount: 1,
          toolCallCount: 0,
          permissionRequestCount: 0,
          deniedCount: 0,
          durationMs: 1
        },
        evidence: {
          tracePath: "out/trace.jsonl",
          worktreePath: "out/worktree"
        },
        limitations: [],
        finalAnswer
      }
    ],
    totals: {
      tasks: 1,
      passed: 1,
      failed: 0,
      errors: 0,
      checks: 1,
      checkPasses: 1,
      checkFailures: 0
    },
    metrics: {
      taskPassRate: 1,
      requiredCheckPassRate: 1,
      traceParseRate: 1,
      safetyDenialRate: 1,
      unexpectedWriteCount: 0,
      durationMs: 1
    },
    limitations: [],
    notRun: [],
    commandsRun: [],
    releaseLog: {
      sourcePath: "CHANGELOG.md",
      entries: [
        {
          version: "Unreleased",
          date: null,
          status: "unreleased",
          sections: [
            {
              title: "新增",
              items: ["HTML report"]
            }
          ],
          itemCount: 1
        }
      ],
      totals: {
        releases: 1,
        sections: 1,
        items: 1,
        unreleasedItems: 1
      },
      limitations: []
    }
  };
}
