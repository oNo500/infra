import { readdir, stat, readFile } from "node:fs/promises";
import { join, basename } from "node:path";
import { execFileSync } from "node:child_process";

// ── ANSI 颜色 ────────────────────────────────────────────
const R = "\x1b[0m", B = "\x1b[1m";
const GREEN = "\x1b[32m", YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m", BLUE = "\x1b[34m";
const WHITE = "\x1b[37m", GRAY = "\x1b[90m";

const badge = {
  ok:   (s: string) => `${GREEN}●${R} ${s}`,
  warn: (s: string) => `${YELLOW}◐${R} ${s}`,
  off:  (s: string) => `${GRAY}○${R} ${s}`,
};

const c = {
  cyan:   (s: string) => `${CYAN}${s}${R}`,
  green:  (s: string) => `${GREEN}${s}${R}`,
  yellow: (s: string) => `${YELLOW}${s}${R}`,
  white:  (s: string) => `${WHITE}${s}${R}`,
  gray:   (s: string) => `${GRAY}${s}${R}`,
  bold:   (s: string) => `${B}${s}${R}`,
};

// ── 路径常量 ─────────────────────────────────────────────
const HOME = process.env.HOME!;
const CLAUDE_SETTINGS = `${HOME}/.claude/settings.json`;
const CLAUDE_DESKTOP_CONFIG = `${HOME}/Library/Application Support/Claude/claude_desktop_config.json`;
const SKILLS_DIR = `${HOME}/.agents/skills`;
const OBSIDIAN_NOTES = `${HOME}/Library/Mobile Documents/iCloud~md~obsidian/Documents/notes`;
const CURSOR_SETTINGS = `${HOME}/Library/Application Support/Cursor/User/settings.json`;

// ── 工具函数 ─────────────────────────────────────────────
function printLine() {
  console.log(`${GRAY}──────────────────────────────────────────────────────────────${R}`);
}

function section(title: string) {
  console.log("");
  console.log(`${B}${BLUE}▌ ${title}${R}`);
  console.log(`${GRAY}  ${"─".repeat(55)}${R}`);
}

// 修复 1：用 execFileSync 替换 Bun.spawn
async function runCmd(cmd: string, args: string[]): Promise<string | null> {
  return new Promise((resolve) => {
    try {
      const out = execFileSync(cmd, args, { encoding: "utf8", timeout: 5000 });
      resolve(out.trim() || null);
    } catch {
      resolve(null);
    }
  });
}

// 修复 1：用 fs.readFile 替换 Bun.file
async function readJsonFile<T>(filePath: string): Promise<T | null> {
  try {
    return JSON.parse(await readFile(filePath, "utf8")) as T;
  } catch {
    return null;
  }
}

// 修复 2：中文宽度感知函数
function displayWidth(s: string): number {
  let w = 0;
  for (const ch of s) {
    const cp = ch.codePointAt(0)!;
    if (
      (cp >= 0x1100 && cp <= 0x115f) || // Hangul Jamo
      (cp >= 0x2e80 && cp <= 0x9fff) || // CJK 汉字
      (cp >= 0xac00 && cp <= 0xd7af) || // Hangul Syllables
      (cp >= 0xf900 && cp <= 0xfaff) || // CJK 兼容
      (cp >= 0xfe10 && cp <= 0xfe6f) || // CJK 兼容形式
      (cp >= 0xff01 && cp <= 0xff60)    // 全角符号
    ) {
      w += 2;
    } else {
      w += 1;
    }
  }
  return w;
}

function centerInBox(content: string, innerWidth: number): string {
  const cw = displayWidth(content);
  const total = innerWidth - cw;
  const left = Math.floor(total / 2);
  return " ".repeat(Math.max(0, left)) + content + " ".repeat(Math.max(0, total - left));
}

// ── Claude Code 模块 ──────────────────────────────────────
async function claudeCodeSection() {
  section("Claude Code");

  const settings = await readJsonFile<{
    model?: string;
    language?: string;
    skipDangerousModePermissionPrompt?: boolean;
  }>(CLAUDE_SETTINGS);

  if (!settings) {
    console.log(`  ${badge.off("配置文件未找到")}`);
    return;
  }

  const verOut = await runCmd("claude", ["--version"]);
  const verMatch = verOut?.match(/\d+\.\d+\.\d+/);
  const version = verMatch ? verMatch[0] : "unknown";

  console.log(`  ${badge.ok("版本")}     ${c.white(version)}`);
  console.log(`  ${badge.ok("模型")}     ${c.white(settings.model ?? "?")}`);
  console.log(`  ${badge.ok("语言")}     ${c.white(settings.language ?? "?")}`);

  if (settings.skipDangerousModePermissionPrompt) {
    console.log(`  ${badge.warn("危险确认")} ${c.yellow("已跳过")}`);
  } else {
    console.log(`  ${badge.ok("危险确认")} ${c.white("开启")}`);
  }

  return version;
}

// ── MCP 服务器模块 ────────────────────────────────────────
async function mcpServersSection() {
  section("MCP 服务器");

  const config = await readJsonFile<{
    mcpServers?: Record<string, { command?: string; args?: string[] }>;
  }>(CLAUDE_DESKTOP_CONFIG);

  if (!config?.mcpServers) {
    console.log(`  ${badge.off("claude_desktop_config.json 未找到")}`);
    return;
  }

  for (const [name, server] of Object.entries(config.mcpServers)) {
    const args = server.args ?? [];
    const pkg = args.find(a => a.startsWith("@")) ?? server.command ?? "";
    const nameStr = name.padEnd(22);
    console.log(`  ${GREEN}●${R} ${nameStr} ${GRAY}${pkg}${R}`);
  }
}

// ── Skills 模块 ───────────────────────────────────────────
async function skillsSection() {
  section(`Skills (${HOME}/.agents/skills)`);

  try {
    const entries = await readdir(SKILLS_DIR);
    const skills = entries.filter(e => !e.startsWith(".")).sort();

    console.log(`  ${GRAY}共 ${WHITE}${skills.length}${GRAY} 个已安装${R}`);
    console.log("");

    const COL_WIDTH = 27;
    process.stdout.write("  ");
    for (let i = 0; i < skills.length; i++) {
      const visible = skills[i].padEnd(COL_WIDTH);
      process.stdout.write(`${GREEN}●${R} ${visible}`);
      if ((i + 1) % 2 === 0) {
        process.stdout.write("\n");
        if (i < skills.length - 1) process.stdout.write("  ");
      }
    }
    if (skills.length % 2 !== 0) {
      process.stdout.write("\n");
    }
  } catch {
    console.log(`  ${badge.off("Skills 目录未找到")}`);
  }
}

// ── Obsidian 模块 ─────────────────────────────────────────
async function countMd(dir: string, maxDepth = 99, depth = 0): Promise<number> {
  if (depth > maxDepth) return 0;
  let count = 0;
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        count += await countMd(join(dir, entry.name), maxDepth, depth + 1);
      } else if (entry.isFile() && entry.name.endsWith(".md")) {
        count++;
      }
    }
  } catch { /* ignore */ }
  return count;
}

// 修复 4：统计子目录数（项目数/领域数）
async function countSubdirs(dir: string): Promise<number> {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    return entries.filter(e => e.isDirectory() && !e.name.startsWith(".")).length;
  } catch {
    return 0;
  }
}

async function getRecentMd(dir: string, exclude = "99-system", topN = 3): Promise<string[]> {
  const files: { name: string; mtime: number }[] = [];

  async function walk(d: string, depth = 0) {
    if (depth > 5) return;
    try {
      const entries = await readdir(d, { withFileTypes: true });
      for (const entry of entries) {
        const full = join(d, entry.name);
        if (entry.isDirectory()) {
          if (!full.includes(exclude)) {
            await walk(full, depth + 1);
          }
        } else if (entry.isFile() && entry.name.endsWith(".md")) {
          const s = await stat(full);
          files.push({ name: entry.name.replace(/\.md$/, ""), mtime: s.mtimeMs });
        }
      }
    } catch { /* ignore */ }
  }

  await walk(dir);
  files.sort((a, b) => b.mtime - a.mtime);
  return files.slice(0, topN).map(f => f.name);
}

async function obsidianSection() {
  section("Obsidian 笔记库");

  try {
    await stat(OBSIDIAN_NOTES);
  } catch {
    console.log(`  ${badge.off("Obsidian 库未找到")}`);
    return;
  }

  // 修复 4：项目数/领域数用 countSubdirs，文件类统计用 countMd
  const [inboxCount, projCount, areaCount, resCount, archCount] = await Promise.all([
    countMd(`${OBSIDIAN_NOTES}/00-inbox`, 1),
    countSubdirs(`${OBSIDIAN_NOTES}/10-projects`),
    countSubdirs(`${OBSIDIAN_NOTES}/20-areas`),
    countMd(`${OBSIDIAN_NOTES}/30-resources`, 2),
    countMd(`${OBSIDIAN_NOTES}/90-archive`),
  ]);

  if (inboxCount > 10) {
    console.log(`  ${badge.warn("00-inbox")}       ${c.yellow(`(${inboxCount} 条待整理!)`)}`);
  } else {
    console.log(`  ${badge.ok("00-inbox")}       ${GRAY}${inboxCount} 条${R}`);
  }

  console.log(`  ${GREEN}●${R} ${"10-projects".padEnd(14)} ${GRAY}${projCount} 个项目${R}`);
  console.log(`  ${GREEN}●${R} ${"20-areas".padEnd(14)} ${GRAY}${areaCount} 个领域${R}`);
  console.log(`  ${GREEN}●${R} ${"30-resources".padEnd(14)} ${GRAY}${resCount} 篇参考${R}`);
  console.log(`  ${GRAY}○${R} ${"90-archive".padEnd(14)} ${GRAY}${archCount} 篇归档${R}`);

  const recent = await getRecentMd(OBSIDIAN_NOTES);
  if (recent.length > 0) {
    console.log("");
    console.log(`  ${GRAY}近期更新:${R}`);
    for (const name of recent) {
      console.log(`  ${GRAY}  · ${WHITE}${name}${R}`);
    }
  }
}

// ── Cursor 模块 ───────────────────────────────────────────
async function cursorSection() {
  section("Cursor");

  const settings = await readJsonFile<Record<string, unknown>>(CURSOR_SETTINGS);

  if (!settings) {
    console.log(`  ${badge.off("Cursor 配置未找到")}`);
    return;
  }

  const formatter = (settings["editor.defaultFormatter"] as string) ?? "?";
  const aiLang = (settings["cline.preferredLanguage"] as string) ?? "?";

  console.log(`  ${badge.ok("格式化器")}   ${c.white(formatter)}`);
  console.log(`  ${badge.ok("AI 语言")}   ${c.white(aiLang)}`);

  let projCount = 0;
  try {
    const entries = await readdir(`${HOME}/.cursor/projects`);
    projCount = entries.filter(e => !e.startsWith(".")).length;
  } catch { /* ignore */ }

  console.log(`  ${badge.ok("已记录项目")} ${c.white(String(projCount))} 个`);
}

// ── 活跃项目模块 ──────────────────────────────────────────
async function activeProjectsSection() {
  section("活跃代码项目 (~/code)");

  const codeDir = `${HOME}/code`;
  try {
    await stat(codeDir);
  } catch {
    console.log(`  ${badge.off("~/code 目录未找到")}`);
    return;
  }

  const entries = await readdir(codeDir, { withFileTypes: true });
  const dirs = entries
    .filter(e => e.isDirectory())
    .map(e => join(codeDir, e.name));

  const weekAgo = Math.floor(Date.now() / 1000) - 7 * 86400;

  console.log(`  ${GRAY}最近 7 天有活动的项目:${R}`);

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

  const active = results.filter(Boolean) as NonNullable<typeof results[0]>[];

  if (active.length === 0) {
    console.log(`  ${GRAY}  (无近期活动)${R}`);
    return;
  }

  for (const proj of active) {
    const nameStr = proj.name.padEnd(20);
    console.log(`  ${GREEN}●${R} ${nameStr} ${CYAN}${proj.branch}${R} ${GRAY}${proj.date} · ${proj.msg}${R}`);
  }
}

// ── main ──────────────────────────────────────────────────
async function main() {
  console.clear();
  console.log("");

  const now = new Date().toLocaleString("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).replace(/\//g, "-").replace(",", "");

  // 修复 2：用宽度感知函数居中标题
  const INNER = 58;
  const titleContent = `AI 工具配置看板  ${now}`;

  console.log(`${B}${CYAN}`);
  console.log("  ╔══════════════════════════════════════════════════════════╗");
  console.log(`  ║${centerInBox(titleContent, INNER)}║`);
  console.log("  ╚══════════════════════════════════════════════════════════╝");
  console.log(`${R}`);

  const version = await claudeCodeSection();
  await mcpServersSection();
  await skillsSection();
  await obsidianSection();
  await cursorSection();
  await activeProjectsSection();

  console.log("");
  printLine();
  // 修复 6：更新 footer 路径
  console.log(`  ${GRAY}运行 ${WHITE}node ~/code/infra/dist/dashboard.js${GRAY} 刷新  ·  Claude Code v${version ?? "?"}${R}`);
  console.log("");
}

main().catch(console.error);
