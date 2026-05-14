import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, test } from "bun:test";

const skillDir = ".agents/skills/html-work-reports";
const createReportScript = `${skillDir}/scripts/create-report.mjs`;
const validateReportScript = `${skillDir}/scripts/validate-html-report.mjs`;

describe("html-work-reports skill", () => {
  test("documents the local Chinese-first report contract", () => {
    const skill = readFileSync(`${skillDir}/SKILL.md`, "utf8");
    const patterns = readFileSync(
      `${skillDir}/references/html-report-patterns.md`,
      "utf8"
    );

    expect(skill).toContain("生成器优先工作流");
    expect(skill).toContain(".agent-harness/reports/latest/change-report.html");
    expect(skill).toContain("不要使用本 skill");
    expect(skill).toContain("repo-relative `file:line`");
    expect(patterns).toContain("HTML 工作汇报是本地审查 artifact");
    expect(patterns).toContain("不能把降级写成通过");
  });

  test("generates and validates a self-contained fixture report", () => {
    const outDir = mkdtempSync(path.join(tmpdir(), "agent-harness-html-report-"));
    const generated = spawnSync(
      process.execPath,
      [
        createReportScript,
        "--input",
        `${skillDir}/assets/fixtures/pre-rendered-report.json`,
        "--out-dir",
        outDir,
        "--slug",
        "fixture-report",
        "--json"
      ],
      { encoding: "utf8" }
    );

    expect(generated.status, generated.stderr).toBe(0);
    const payload = JSON.parse(generated.stdout) as { outputPath: string };
    const html = readFileSync(payload.outputPath, "utf8");

    expect(html).toContain("data-html-work-report");
    expect(html).toContain('data-render-mode="pre-rendered"');
    expect(html).not.toContain("https://cdn.jsdelivr.net");
    expect(html).toContain("data-source-link");
    expect(html).toContain('data-section-type="diff"');

    const validation = spawnSync(
      process.execPath,
      [validateReportScript, payload.outputPath, "--json", "--skip-browser"],
      { encoding: "utf8" }
    );

    expect(validation.status, validation.stderr).toBe(0);
    const result = JSON.parse(validation.stdout) as {
      ok: boolean;
      checks: string[];
      browser: { status: string; reason: string };
    };

    expect(result.ok).toBe(true);
    expect(result.checks).toContain("source-linked-code-evidence");
    expect(result.checks).toContain("diff-rendered");
    expect(result.browser.status).toBe("degraded");
    expect(result.browser.reason).toContain("skipped");
  });

  test("preserves Chinese report titles and creates stable section anchors", () => {
    const outDir = mkdtempSync(path.join(tmpdir(), "agent-harness-html-report-zh-"));
    const inputPath = path.join(outDir, "input.json");
    writeFileSync(
      inputPath,
      JSON.stringify(
        {
          title: "中文汇报",
          summary: "结论优先，证据可审查。",
          status: "complete",
          sections: [
            {
              type: "markdown",
              title: "完成内容",
              content: "## 结果\n\n- 已生成报告"
            },
            {
              type: "markdown",
              title: "验证摘要",
              content: "- validator 通过"
            }
          ],
          evidence: [
            {
              kind: "file",
              label: "证据文件",
              value: ".agents/skills/html-work-reports/SKILL.md",
              status: "pass"
            }
          ]
        },
        null,
        2
      )
    );

    const generated = spawnSync(
      process.execPath,
      [
        createReportScript,
        "--input",
        inputPath,
        "--out-dir",
        outDir,
        "--slug",
        "zh-report",
        "--json"
      ],
      { encoding: "utf8" }
    );

    expect(generated.status, generated.stderr).toBe(0);
    const payload = JSON.parse(generated.stdout) as { outputPath: string };
    const html = readFileSync(payload.outputPath, "utf8");

    expect(html).toContain('<html lang="zh-CN"');
    expect(html).toContain("中文汇报");
    expect(html).toContain("完成内容");
    expect(html).toContain("验证摘要");
    expect(html).not.toContain("????");
    expect(html).toContain("section-html-work-report-");
    expect(
      new Set(html.match(/href="#section-[^"]+"/g) ?? []).size
    ).toBeGreaterThanOrEqual(2);
  });
});
