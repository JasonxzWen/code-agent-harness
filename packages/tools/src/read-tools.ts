import { readFile, realpath } from "node:fs/promises";
import path from "node:path";
import simpleGit from "simple-git";
import { z } from "zod";
import type { ToolDefinition } from "@code-agent-harness/core";
import { integerSchema, objectJsonSchema, stringSchema } from "./json-schema";
import {
  assertTextBuffer,
  listSafeFiles,
  resolveSafePath,
  toPosixPath
} from "./policies";

const ListFilesInputSchema = z.object({
  path: z.string().default("."),
  maxResults: z.number().int().min(1).max(1000).default(200)
});

const ReadFileInputSchema = z.object({
  path: z.string().min(1),
  maxBytes: z.number().int().min(1).max(100_000).default(20_000)
});

const SearchRepoInputSchema = z.object({
  query: z.string().min(1),
  path: z.string().default("."),
  maxResults: z.number().int().min(1).max(100).default(20),
  contextLines: z.number().int().min(0).max(5).default(1)
});

const GitStatusInputSchema = z.object({});

export const listFilesTool: ToolDefinition<z.infer<typeof ListFilesInputSchema>> = {
  name: "list_files",
  description: "List safe repository files with stable ordering and bounded output.",
  inputSchema: ListFilesInputSchema,
  inputJsonSchema: objectJsonSchema({
    path: stringSchema,
    maxResults: integerSchema
  }),
  async execute(input, context) {
    const result = await listSafeFiles(context.repoRoot, input.path, input.maxResults);
    return {
      path: input.path,
      ...result
    };
  }
};

export const readFileTool: ToolDefinition<z.infer<typeof ReadFileInputSchema>> = {
  name: "read_file",
  description: "Read a safe text file from the repository with explicit truncation.",
  inputSchema: ReadFileInputSchema,
  inputJsonSchema: objectJsonSchema(
    {
      path: stringSchema,
      maxBytes: integerSchema
    },
    ["path"]
  ),
  async execute(input, context) {
    const safePath = await resolveSafePath(context.repoRoot, input.path);
    const realRoot = await realpath(context.repoRoot);
    const buffer = await readFile(safePath);
    assertTextBuffer(buffer, input.path);

    const truncated = buffer.byteLength > input.maxBytes;
    const content = buffer.subarray(0, input.maxBytes).toString("utf8");

    return {
      path: toPosixPath(path.relative(realRoot, safePath)),
      content,
      truncated,
      bytesRead: Math.min(buffer.byteLength, input.maxBytes),
      sizeBytes: buffer.byteLength
    };
  }
};

export const searchRepoTool: ToolDefinition<z.infer<typeof SearchRepoInputSchema>> = {
  name: "search_repo",
  description: "Search safe text files and return bounded line snippets.",
  inputSchema: SearchRepoInputSchema,
  inputJsonSchema: objectJsonSchema(
    {
      query: stringSchema,
      path: stringSchema,
      maxResults: integerSchema,
      contextLines: integerSchema
    },
    ["query"]
  ),
  async execute(input, context) {
    const listed = await listSafeFiles(context.repoRoot, input.path, 1000);
    const query = input.query.toLowerCase();
    const matches: Array<{
      path: string;
      line: number;
      snippet: string;
    }> = [];

    for (const file of listed.files) {
      if (matches.length >= input.maxResults) {
        break;
      }

      const safePath = await resolveSafePath(context.repoRoot, file);
      const buffer = await readFile(safePath);
      try {
        assertTextBuffer(buffer, file);
      } catch {
        continue;
      }

      const lines = buffer.toString("utf8").split(/\r?\n/);
      for (const [index, line] of lines.entries()) {
        if (line.toLowerCase().includes(query)) {
          const start = Math.max(0, index - input.contextLines);
          const end = Math.min(lines.length, index + input.contextLines + 1);
          matches.push({
            path: file,
            line: index + 1,
            snippet: lines.slice(start, end).join("\n")
          });
        }

        if (matches.length >= input.maxResults) {
          break;
        }
      }
    }

    return {
      query: input.query,
      matches,
      truncated: listed.truncated || matches.length >= input.maxResults
    };
  }
};

export const gitStatusTool: ToolDefinition<z.infer<typeof GitStatusInputSchema>> = {
  name: "git_status",
  description: "Return read-only git status information for the repository.",
  inputSchema: GitStatusInputSchema,
  inputJsonSchema: objectJsonSchema({}),
  async execute(_input, context) {
    const status = await simpleGit(context.repoRoot).status();
    return {
      current: status.current ?? null,
      clean: status.isClean(),
      files: status.files.map((file) => ({
        path: file.path,
        workingTree: file.working_dir,
        index: file.index
      }))
    };
  }
};
