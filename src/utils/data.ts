import { readdir, stat } from "node:fs/promises";
import { join, basename } from "node:path";
import { runCmd, obsidianCmd, obsidianCmdMulti, obsidianCliAvailable } from "./cmd.ts";
import { readJsonFile, countMd, countSubdirs, getRecentMd } from "./fs.ts";

const HOME = process.env.HOME!;
const CLAUDE_SETTINGS = `${HOME}/.claude/settings.json`;
const CLAUDE_DESKTOP_CONFIG = `${HOME}/Library/Application Support/Claude/claude_desktop_config.json`;
const SKILLS_DIR = `${HOME}/.agents/skills`;
const OBSIDIAN_NOTES = `${HOME}/Library/Mobile Documents/iCloud~md~obsidian/Documents/notes`;
const CURSOR_SETTINGS = `${HOME}/Library/Application Support/Cursor/User/settings.json`;

export interface ClaudeData {
  version: string;
  model: string;
  language: string;
  skipDangerous: boolean;
  available: boolean;
}

export interface McpData {
  servers: Array<{ name: string; pkg: string }>;
  available: boolean;
}

export interface SkillsData {
  skills: string[];
  available: boolean;
}

export interface ObsidianFolderStat {
  inboxCount: number;
  projCount: number;
  areaCount: number;
  resCount: number;
  archCount: number;
  recent: string[];
  topTags: string[];
}

export interface ObsidianData {
  available: boolean;
  mode: "cli" | "fs" | "unavailable";
  stats: ObsidianFolderStat | null;
}

export interface CursorData {
  formatter: string;
  aiLang: string;
  projCount: number;
  available: boolean;
}

export interface ActiveProject {
  name: string;
  branch: string;
  msg: string;
  date: string;
}

export interface ProjectsData {
  projects: ActiveProject[];
  available: boolean;
}

export interface AppData {
  claude: ClaudeData;
  mcp: McpData;
  skills: SkillsData;
  obsidian: ObsidianData;
  cursor: CursorData;
  projects: ProjectsData;
  now: string;
}

export async function collectClaudeData(): Promise<ClaudeData> {
  const settings = await readJsonFile<{
    model?: string;
    language?: string;
    skipDangerousModePermissionPrompt?: boolean;
  }>(CLAUDE_SETTINGS);

  if (!settings) {
    return { version: "unknown", model: "?", language: "?", skipDangerous: false, available: false };
  }

  const verOut = await runCmd("claude", ["--version"]);
  const verMatch = verOut?.match(/\d+\.\d+\.\d+/);
  const version = verMatch ? verMatch[0] : "unknown";

  return {
    version,
    model: settings.model ?? "?",
    language: settings.language ?? "?",
    skipDangerous: settings.skipDangerousModePermissionPrompt ?? false,
    available: true,
  };
}

export async function collectMcpData(): Promise<McpData> {
  const config = await readJsonFile<{
    mcpServers?: Record<string, { command?: string; args?: string[] }>;
  }>(CLAUDE_DESKTOP_CONFIG);

  if (!config?.mcpServers) {
    return { servers: [], available: false };
  }

  const servers = Object.entries(config.mcpServers).map(([name, server]) => {
    const args = server.args ?? [];
    const pkg = args.find(a => a.startsWith("@")) ?? server.command ?? "";
    return { name, pkg };
  });

  return { servers, available: true };
}

export async function collectSkillsData(): Promise<SkillsData> {
  try {
    const entries = await readdir(SKILLS_DIR);
    const skills = entries.filter(e => !e.startsWith(".")).sort();
    return { skills, available: true };
  } catch {
    return { skills: [], available: false };
  }
}

async function collectObsidianStatsCli(): Promise<ObsidianFolderStat> {
  const [inboxRaw, projRaw, areaRaw, resRaw, archRaw, recentRaw, tagsRaw] = await Promise.all([
    obsidianCmd(["files", "folder=00-inbox", "total"]),
    obsidianCmd(["files", "folder=10-projects", "total"]),
    obsidianCmd(["files", "folder=20-areas", "total"]),
    obsidianCmd(["files", "folder=30-resources", "total"]),
    obsidianCmd(["files", "folder=90-archive", "total"]),
    obsidianCmd(["eval", `code=JSON.stringify(app.vault.getMarkdownFiles().sort((a,b)=>b.stat.mtime-a.stat.mtime).slice(0,3).map(f=>f.basename))`]),
    obsidianCmdMulti(["tags", "sort=count", "counts", "format=tsv"]),
  ]);

  const inboxCount = parseInt(inboxRaw ?? "0", 10) || 0;
  const projCount  = parseInt(projRaw  ?? "0", 10) || 0;
  const areaCount  = parseInt(areaRaw  ?? "0", 10) || 0;
  const resCount   = parseInt(resRaw   ?? "0", 10) || 0;
  const archCount  = parseInt(archRaw  ?? "0", 10) || 0;

  let recent: string[] = [];
  if (recentRaw) {
    try { recent = JSON.parse(recentRaw); } catch { /* ignore */ }
  }

  const topTags: string[] = [];
  if (tagsRaw) {
    tagsRaw.split("\n").slice(0, 5).forEach(line => {
      const [tag, cnt] = line.split("\t");
      if (tag && cnt) topTags.push(`${tag}(${cnt})`);
    });
  }

  return { inboxCount, projCount, areaCount, resCount, archCount, recent, topTags };
}

async function collectObsidianStatsFs(): Promise<ObsidianFolderStat> {
  const [inboxCount, projCount, areaCount, resCount, archCount] = await Promise.all([
    countMd(`${OBSIDIAN_NOTES}/00-inbox`, 1),
    countSubdirs(`${OBSIDIAN_NOTES}/10-projects`),
    countSubdirs(`${OBSIDIAN_NOTES}/20-areas`),
    countMd(`${OBSIDIAN_NOTES}/30-resources`, 2),
    countMd(`${OBSIDIAN_NOTES}/90-archive`),
  ]);

  const recent = await getRecentMd(OBSIDIAN_NOTES);

  return { inboxCount, projCount, areaCount, resCount, archCount, recent, topTags: [] };
}

export async function collectObsidianData(): Promise<ObsidianData> {
  try {
    await stat(OBSIDIAN_NOTES);
  } catch {
    return { available: false, mode: "unavailable", stats: null };
  }

  const cliOk = await obsidianCliAvailable();
  if (cliOk) {
    const stats = await collectObsidianStatsCli();
    return { available: true, mode: "cli", stats };
  } else {
    const stats = await collectObsidianStatsFs();
    return { available: true, mode: "fs", stats };
  }
}

export async function collectCursorData(): Promise<CursorData> {
  const settings = await readJsonFile<Record<string, unknown>>(CURSOR_SETTINGS);

  if (!settings) {
    return { formatter: "?", aiLang: "?", projCount: 0, available: false };
  }

  const formatter = (settings["editor.defaultFormatter"] as string) ?? "?";
  const aiLang = (settings["cline.preferredLanguage"] as string) ?? "?";

  let projCount = 0;
  try {
    const entries = await readdir(`${HOME}/.cursor/projects`);
    projCount = entries.filter(e => !e.startsWith(".")).length;
  } catch { /* ignore */ }

  return { formatter, aiLang, projCount, available: true };
}

export async function collectProjectsData(): Promise<ProjectsData> {
  const codeDir = `${HOME}/code`;
  try {
    await stat(codeDir);
  } catch {
    return { projects: [], available: false };
  }

  const entries = await readdir(codeDir, { withFileTypes: true });
  const dirs = entries
    .filter(e => e.isDirectory())
    .map(e => join(codeDir, e.name));

  const weekAgo = Math.floor(Date.now() / 1000) - 7 * 86400;

  const results = await Promise.all(
    dirs.map(async (dir) => {
      try {
        await stat(join(dir, ".git"));
      } catch {
        return null;
      }

      const [commitTs, branch, msg, date] = await Promise.all([
        runCmd("git", ["-C", dir, "log", "-1", "--format=%ct"]),
        runCmd("git", ["-C", dir, "branch", "--show-current"]),
        runCmd("git", ["-C", dir, "log", "-1", "--format=%s"]),
        runCmd("git", ["-C", dir, "log", "-1", "--format=%cr"]),
      ]);

      if (!commitTs || parseInt(commitTs) <= weekAgo) return null;

      return {
        name: basename(dir),
        branch: branch ?? "",
        msg: (msg ?? "").slice(0, 40),
        date: date ?? "",
      };
    })
  );

  const projects = results.filter(Boolean) as ActiveProject[];
  return { projects, available: true };
}

export async function collectAllData(): Promise<AppData> {
  const now = new Date().toLocaleString("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).replace(/\//g, "-").replace(",", "");

  const [claude, mcp, skills, obsidian, cursor, projects] = await Promise.all([
    collectClaudeData(),
    collectMcpData(),
    collectSkillsData(),
    collectObsidianData(),
    collectCursorData(),
    collectProjectsData(),
  ]);

  return { claude, mcp, skills, obsidian, cursor, projects, now };
}
