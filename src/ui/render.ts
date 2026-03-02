import chalk from 'chalk'
import { badgeOk, badgeWarn, badgeOff, HR, SECTION_HR } from './symbols.js'

export interface ClaudeInfo {
  version: string | null
  model: string | null
  language: string | null
  skipDangerousMode: boolean
}

export interface McpInfo {
  servers: Array<{ name: string; pkg: string }>
}

export interface CursorInfo {
  settingsExists: boolean
  formatter: string | null
  aiLang: string | null
  projCount: number
}

export interface SkillInfo {
  skills: Array<{ name: string; description: string | null }>
}

export interface GitInfo {
  projects: Array<{ name: string; lastCommit: string; branch: string; msg: string }>
}

export interface ProjectInfo {
  root: string | null
  name: string | null
  claudeMd: { exists: boolean; lines: number; title: string | null }
  dotClaude: {
    exists: boolean
    hasSettings: boolean
    hasHooks: boolean
    hasCommands: boolean
    hasSkills: boolean
    permissionCount: number
  }
  mcpJson: { exists: boolean; serverCount: number; servers: string[] }
  cursorRules: boolean
}

export interface ObsidianInfo {
  exists: boolean
  inboxCount: number
  recentNotes: string[]
  folders: Array<{ name: string; count: number; warn: boolean }>
}

export interface DashboardData {
  claude: ClaudeInfo
  mcp: McpInfo
  cursor: CursorInfo
  skills: SkillInfo
  git: GitInfo
  project?: ProjectInfo
}

// CJK-aware padding
const cjkWidth = (s: string) =>
  [...s].reduce((w, c) => w + (c.charCodeAt(0) > 0x2e7f ? 2 : 1), 0)
const pad = (s: string, w: number) => s + ' '.repeat(Math.max(0, w - cjkWidth(s)))

function printHeader(title = ' AI 工具链状态 '): void {
  const now = new Date().toLocaleString('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
  const timeStr = ` ${now} `
  const inner = 62
  const totalUsed = cjkWidth(title) + cjkWidth(timeStr)
  const gap = Math.max(1, inner - totalUsed)
  const top = chalk.cyan('╔' + '═'.repeat(inner) + '╗')
  const mid =
    chalk.cyan('║') +
    chalk.bold.white(title) +
    ' '.repeat(gap) +
    chalk.gray(timeStr) +
    chalk.cyan('║')
  const bot = chalk.cyan('╚' + '═'.repeat(inner) + '╝')
  console.log(top)
  console.log(mid)
  console.log(bot)
}

function section(title: string): void {
  console.log('')
  console.log(`${chalk.cyan('▌')} ${chalk.bold(title)}`)
  console.log(SECTION_HR)
}

function printFooter(version: string | null): void {
  console.log('')
  console.log(HR)
  const hint = version ? `Claude Code ${version}` : 'ws'
  console.log(chalk.gray(`  ${hint} · 按 Ctrl+C 退出`))
}

export function formatDashboard(data: DashboardData): void {
  printHeader()

  // ── Claude Code ──
  section('Claude Code')
  if (data.claude.version) {
    console.log(`  ${badgeOk(pad('版本', 8))}${chalk.white(data.claude.version)}`)
  } else {
    console.log(`  ${badgeOff('未安装')}`)
  }
  if (data.claude.model) {
    console.log(`  ${badgeOk(pad('模型', 8))}${chalk.white(data.claude.model)}`)
  }
  if (data.claude.language) {
    console.log(`  ${badgeOk(pad('语言', 8))}${chalk.white(data.claude.language)}`)
  }
  if (data.claude.skipDangerousMode) {
    console.log(`  ${badgeWarn('skipDangerousMode 已开启')}`)
  }

  // ── MCP 服务器 ──
  section('MCP 服务器')
  if (data.mcp.servers.length > 0) {
    for (const srv of data.mcp.servers) {
      console.log(`  ${badgeOk(srv.name.padEnd(22))}${chalk.gray(srv.pkg)}`)
    }
  } else {
    console.log(`  ${badgeOff('未配置')}`)
  }

  // ── Skills ──
  section('已安装 Skills')
  if (data.skills.skills.length > 0) {
    for (const skill of data.skills.skills) {
      const nameStr = pad(skill.name, 28)
      const rawDesc = skill.description?.split(/[.。]/)[0] ?? ''
      const desc = rawDesc ? chalk.gray(rawDesc.slice(0, 50)) : ''
      console.log(`  ${badgeOk(nameStr)}${desc}`)
    }
  } else {
    console.log(`  ${badgeOff('无')}`)
  }

  // ── Cursor ──
  section('Cursor')
  if (data.cursor.settingsExists) {
    if (data.cursor.formatter) {
      console.log(`  ${badgeOk(pad('格式化器', 10))}${chalk.white(data.cursor.formatter)}`)
    }
    if (data.cursor.aiLang) {
      console.log(`  ${badgeOk(pad('AI 语言', 10))}${chalk.white(data.cursor.aiLang)}`)
    }
    if (data.cursor.projCount > 0) {
      console.log(`  ${badgeOk(pad('项目数', 10))}${chalk.white(data.cursor.projCount)}`)
    }
    if (!data.cursor.formatter && !data.cursor.aiLang && data.cursor.projCount === 0) {
      console.log(`  ${badgeOk('配置已加载')}`)
    }
  } else {
    console.log(`  ${badgeOff('未找到配置')}`)
  }

  // ── 当前项目 ──
  if (data.project?.root) {
    const proj = data.project
    section(`当前项目 · ${proj.name}`)

    // CLAUDE.md
    if (proj.claudeMd.exists) {
      const detail = [
        `${proj.claudeMd.lines} 行`,
        proj.claudeMd.title ? chalk.gray(proj.claudeMd.title.slice(0, 30)) : '',
      ].filter(Boolean).join(' · ')
      console.log(`  ${badgeOk(pad('CLAUDE.md', 14))}${detail}`)
    } else {
      console.log(`  ${badgeOff(pad('CLAUDE.md', 14))}${chalk.gray('未配置')}`)
    }

    // .claude/
    if (proj.dotClaude.exists) {
      const parts: string[] = []
      if (proj.dotClaude.hasSettings) parts.push('settings')
      if (proj.dotClaude.permissionCount > 0) parts.push(`${proj.dotClaude.permissionCount} 条权限`)
      if (proj.dotClaude.hasHooks) parts.push('hooks')
      if (proj.dotClaude.hasCommands) parts.push('commands')
      if (proj.dotClaude.hasSkills) parts.push('skills')
      console.log(`  ${badgeOk(pad('.claude/', 14))}${parts.join(' · ')}`)
    } else {
      console.log(`  ${badgeOff(pad('.claude/', 14))}${chalk.gray('未配置')}`)
    }

    // .mcp.json
    if (proj.mcpJson.exists) {
      const srvStr = proj.mcpJson.servers.slice(0, 4).join(', ')
      console.log(`  ${badgeOk(pad('.mcp.json', 14))}${chalk.white(proj.mcpJson.serverCount)} 个服务器${srvStr ? chalk.gray(' · ' + srvStr) : ''}`)
    } else {
      console.log(`  ${badgeOff(pad('.mcp.json', 14))}${chalk.gray('未配置')}`)
    }

    // Cursor rules
    if (proj.cursorRules) {
      console.log(`  ${badgeOk(pad('Cursor rules', 14))}`)
    } else {
      console.log(`  ${badgeOff(pad('Cursor rules', 14))}${chalk.gray('未配置')}`)
    }
  }

  // ── Git ──
  section('活跃 Git 项目（近 7 天）')
  if (data.git.projects.length > 0) {
    for (const p of data.git.projects) {
      const nameStr = p.name.padEnd(20)
      const branchStr = chalk.cyan(p.branch.padEnd(14))
      const commitStr = chalk.gray(p.lastCommit + (p.msg ? ' · ' + p.msg : ''))
      console.log(`  ${badgeOk(nameStr)}${branchStr}${commitStr}`)
    }
  } else {
    console.log(`  ${badgeOff('无活跃项目')}`)
  }

  printFooter(data.claude.version)
}

export function formatNote(data: ObsidianInfo): void {
  printHeader(' Obsidian 笔记库 ')

  section('Obsidian 笔记库')

  if (!data.exists) {
    console.log(`  ${badgeOff('笔记库未找到')}`)
    console.log('')
    console.log(HR)
    return
  }

  // 分目录计数
  if (data.folders.length > 0) {
    for (const folder of data.folders) {
      const label = pad(folder.name, 16)
      const countStr = chalk.gray(`${folder.count} 篇`)
      if (folder.warn) {
        console.log(`  ${badgeWarn(label)}${countStr}  ${chalk.yellow('超过 10 条，请处理')}`)
      } else {
        console.log(`  ${badgeOk(label)}${countStr}`)
      }
    }
  } else {
    // fallback: 只显示 inbox
    const inboxLabel = pad('inbox', 16)
    if (data.inboxCount > 10) {
      console.log(
        `  ${badgeWarn(inboxLabel)}${chalk.gray(data.inboxCount + ' 篇')}  ${chalk.yellow('超过 10 条，请处理')}`,
      )
    } else {
      console.log(`  ${badgeOk(inboxLabel)}${chalk.gray(data.inboxCount + ' 篇')}`)
    }
  }

  // 最近修改
  if (data.recentNotes.length > 0) {
    section('最近修改')
    for (const note of data.recentNotes) {
      console.log(`  ${chalk.gray('–')} ${note}`)
    }
  }

  console.log('')
  console.log(HR)
}
