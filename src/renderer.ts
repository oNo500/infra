import { colors } from "consola/utils";
import { badge } from "./utils/colors.ts";
import type {
  AppData,
  ClaudeData,
  McpData,
  SkillsData,
  ObsidianData,
  CursorData,
  ProjectsData,
} from "./utils/data.ts";

const INNER = 58;
const HOME = process.env.HOME!;

function displayWidth(s: string): number {
  let w = 0;
  for (const ch of s) {
    const cp = ch.codePointAt(0)!;
    if (
      (cp >= 0x1100 && cp <= 0x115f) ||
      (cp >= 0x2e80 && cp <= 0x9fff) ||
      (cp >= 0xac00 && cp <= 0xd7af) ||
      (cp >= 0xf900 && cp <= 0xfaff) ||
      (cp >= 0xfe10 && cp <= 0xfe6f) ||
      (cp >= 0xff01 && cp <= 0xff60)
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

function renderHeader(now: string): string[] {
  const titleContent = `AI 工具配置看板  ${now}`;
  const centeredTitle = centerInBox(titleContent, INNER);
  const line = colors.cyan(colors.bold(
    `  ╔══════════════════════════════════════════════════════════╗`
  ));
  const middle = colors.cyan(colors.bold(`  ║`)) + colors.cyan(colors.bold(centeredTitle)) + colors.cyan(colors.bold(`║`));
  const bottom = colors.cyan(colors.bold(
    `  ╚══════════════════════════════════════════════════════════╝`
  ));
  return ["", line, middle, bottom];
}

function renderSectionHeader(title: string): string[] {
  return [
    "",
    colors.bold(colors.blue("▌ ") + title),
    colors.gray("  " + "─".repeat(55)),
  ];
}

function renderFooter(version: string): string[] {
  return [
    "",
    colors.gray("──────────────────────────────────────────────────────────────"),
    "  " + colors.gray("运行 ") + "node ~/code/infra/dist/dashboard.js" + colors.gray(` 刷新  ·  Claude Code v${version}`),
    "",
  ];
}

function renderClaude(data: ClaudeData): string[] {
  const lines = renderSectionHeader("Claude Code");
  if (!data.available) {
    lines.push(`  ${badge("off")} 配置文件未找到`);
    return lines;
  }
  lines.push(`  ${badge("ok")} ${"版本     "}${colors.white(data.version)}`);
  lines.push(`  ${badge("ok")} ${"模型     "}${colors.white(data.model)}`);
  lines.push(`  ${badge("ok")} ${"语言     "}${colors.white(data.language)}`);
  if (data.skipDangerous) {
    lines.push(`  ${badge("warn")} ${"危险确认 "}${colors.yellow("已跳过")}`);
  } else {
    lines.push(`  ${badge("ok")} ${"危险确认 "}${colors.white("开启")}`);
  }
  return lines;
}

function renderMcp(data: McpData): string[] {
  const lines = renderSectionHeader("MCP 服务器");
  if (!data.available) {
    lines.push(`  ${badge("off")} claude_desktop_config.json 未找到`);
    return lines;
  }
  for (const { name, pkg } of data.servers) {
    lines.push(`  ${badge("ok")} ${name.padEnd(22)}${colors.gray(pkg)}`);
  }
  return lines;
}

function renderSkills(data: SkillsData): string[] {
  const lines = renderSectionHeader(`Skills (${HOME}/.agents/skills)`);
  if (!data.available) {
    lines.push(`  ${badge("off")} Skills 目录未找到`);
    return lines;
  }
  lines.push(`  ${colors.gray("共 ")}${colors.white(String(data.skills.length))}${colors.gray(" 个已安装")}`);
  lines.push("");
  const COL_WIDTH = 27;
  for (let i = 0; i < data.skills.length; i += 2) {
    const left = data.skills[i];
    const right = data.skills[i + 1];
    let row = `  ${badge("ok")} ${left.padEnd(COL_WIDTH)}`;
    if (right !== undefined) {
      row += `${badge("ok")} ${right}`;
    }
    lines.push(row);
  }
  return lines;
}

function renderObsidian(data: ObsidianData): string[] {
  const lines = renderSectionHeader("Obsidian 笔记库");
  if (!data.available || data.mode === "unavailable") {
    lines.push(`  ${badge("off")} Obsidian 库未找到`);
    return lines;
  }
  lines.push(`  ${colors.gray(`[via ${data.mode === "cli" ? "obsidian-cli" : "文件系统"}]`)}`);

  if (data.stats) {
    const { inboxCount, projCount, areaCount, resCount, archCount, recent, topTags } = data.stats;

    if (inboxCount > 10) {
      lines.push(`  ${badge("warn")} ${"00-inbox       "}${colors.yellow(`(${inboxCount} 条待整理!)`)}`);
    } else {
      lines.push(`  ${badge("ok")} ${"00-inbox       "}${colors.gray(`${inboxCount} 条`)}`);
    }
    lines.push(`  ${badge("ok")} ${"10-projects    "}${colors.gray(`${projCount} 个项目`)}`);
    lines.push(`  ${badge("ok")} ${"20-areas       "}${colors.gray(`${areaCount} 个领域`)}`);
    lines.push(`  ${badge("ok")} ${"30-resources   "}${colors.gray(`${resCount} 篇参考`)}`);
    lines.push(`  ${badge("off")} ${"90-archive     "}${colors.gray(`${archCount} 篇归档`)}`);

    if (recent.length > 0) {
      lines.push("");
      lines.push(`  ${colors.gray("近期更新:")}`);
      for (const name of recent) {
        lines.push(`  ${colors.gray("  · ")}${colors.white(name)}`);
      }
    }
    if (topTags.length > 0) {
      lines.push("");
      lines.push(`  ${colors.gray("热门标签: ")}${colors.white(topTags.join("  "))}`);
    }
  }
  return lines;
}

function renderCursor(data: CursorData): string[] {
  const lines = renderSectionHeader("Cursor");
  if (!data.available) {
    lines.push(`  ${badge("off")} Cursor 配置未找到`);
    return lines;
  }
  lines.push(`  ${badge("ok")} ${"格式化器   "}${colors.white(data.formatter)}`);
  lines.push(`  ${badge("ok")} ${"AI 语言   "}${colors.white(data.aiLang)}`);
  lines.push(`  ${badge("ok")} ${"已记录项目 "}${colors.white(String(data.projCount))} 个`);
  return lines;
}

function renderProjects(data: ProjectsData): string[] {
  const lines = renderSectionHeader("活跃代码项目 (~/code)");
  if (!data.available) {
    lines.push(`  ${badge("off")} ~/code 目录未找到`);
    return lines;
  }
  lines.push(`  ${colors.gray("最近 7 天有活动的项目:")}`);
  if (data.projects.length === 0) {
    lines.push(`  ${colors.gray("  (无近期活动)")}`);
  } else {
    for (const proj of data.projects) {
      lines.push(`  ${badge("ok")} ${proj.name.padEnd(20)}${colors.cyan(proj.branch)}${colors.gray(` ${proj.date} · ${proj.msg}`)}`);
    }
  }
  return lines;
}

export function render(data: AppData): string[] {
  return [
    ...renderHeader(data.now),
    ...renderClaude(data.claude),
    ...renderMcp(data.mcp),
    ...renderSkills(data.skills),
    ...renderObsidian(data.obsidian),
    ...renderCursor(data.cursor),
    ...renderProjects(data.projects),
    ...renderFooter(data.claude.version),
  ];
}
