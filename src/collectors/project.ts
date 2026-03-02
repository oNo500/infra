import { readFile, access } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, basename } from 'node:path'
import type { ProjectInfo } from '../ui/render.js'

const exists = (p: string) =>
  access(p)
    .then(() => true)
    .catch(() => false)

async function gitRoot(): Promise<string | null> {
  let dir = process.cwd()
  for (let i = 0; i < 5; i++) {
    if (existsSync(join(dir, '.git'))) return dir
    const parent = join(dir, '..')
    if (parent === dir) return null
    dir = parent
  }
  return null
}

export async function collectProject(): Promise<ProjectInfo> {
  const root = await gitRoot()
  if (!root) return { root: null, name: null, claudeMd: { exists: false, lines: 0, title: null }, dotClaude: { exists: false, hasSettings: false, hasHooks: false, hasCommands: false, hasSkills: false, permissionCount: 0 }, mcpJson: { exists: false, serverCount: 0, servers: [] }, cursorRules: false }

  const name = basename(root)

  const [claudeMdInfo, dotClaudeInfo, mcpJsonInfo, cursorRules] = await Promise.all([
    collectClaudeMd(root),
    collectDotClaude(root),
    collectMcpJson(root),
    collectCursorRules(root),
  ])

  return { root, name, claudeMd: claudeMdInfo, dotClaude: dotClaudeInfo, mcpJson: mcpJsonInfo, cursorRules }
}

async function collectClaudeMd(root: string) {
  const p = join(root, 'CLAUDE.md')
  if (!(await exists(p))) return { exists: false, lines: 0, title: null }
  try {
    const content = await readFile(p, 'utf-8')
    const lines = content.split('\n').length
    const titleMatch = content.match(/^#\s+(.+)/m)
    const title = titleMatch ? titleMatch[1].trim() : null
    return { exists: true, lines, title }
  } catch {
    return { exists: true, lines: 0, title: null }
  }
}

async function collectDotClaude(root: string) {
  const dir = join(root, '.claude')
  if (!(await exists(dir))) {
    return { exists: false, hasSettings: false, hasHooks: false, hasCommands: false, hasSkills: false, permissionCount: 0 }
  }

  const [hasSettings, settingsContent, hasCommands, hasSkills] = await Promise.all([
    exists(join(dir, 'settings.json')).then(a => a || exists(join(dir, 'settings.local.json'))),
    readSettingsContent(dir),
    exists(join(dir, 'commands')),
    exists(join(dir, 'skills')),
  ])

  const hasHooks = settingsContent?.hasHooks ?? false
  const permissionCount = settingsContent?.permissionCount ?? 0

  return { exists: true, hasSettings, hasHooks, hasCommands, hasSkills, permissionCount }
}

async function readSettingsContent(dir: string): Promise<{ hasHooks: boolean; permissionCount: number } | null> {
  for (const name of ['settings.local.json', 'settings.json']) {
    const p = join(dir, name)
    if (!(await exists(p))) continue
    try {
      const raw = await readFile(p, 'utf-8')
      const json = JSON.parse(raw)
      const hasHooks = typeof json.hooks === 'object' && json.hooks !== null && Object.keys(json.hooks).length > 0
      const allows: unknown[] = Array.isArray(json.permissions?.allow) ? json.permissions.allow : []
      return { hasHooks, permissionCount: allows.length }
    } catch {
      return null
    }
  }
  return null
}

async function collectMcpJson(root: string) {
  const p = join(root, '.mcp.json')
  if (!(await exists(p))) return { exists: false, serverCount: 0, servers: [] }
  try {
    const raw = await readFile(p, 'utf-8')
    const json = JSON.parse(raw)
    const serversObj = json.mcpServers ?? json.servers ?? {}
    const servers = Object.keys(serversObj)
    return { exists: true, serverCount: servers.length, servers }
  } catch {
    return { exists: true, serverCount: 0, servers: [] }
  }
}

async function collectCursorRules(root: string): Promise<boolean> {
  const [a, b] = await Promise.all([
    exists(join(root, '.cursorrules')),
    exists(join(root, '.cursor', 'rules')),
  ])
  return a || b
}
