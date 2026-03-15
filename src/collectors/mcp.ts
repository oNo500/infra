import { readFile, access } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import type { McpInfo } from '../ui/render.js'

const HOME = homedir()
const MCP_CONFIG = join(HOME, 'Library/Application Support/Claude/claude_desktop_config.json')
const CLAUDE_JSON = join(HOME, '.claude.json')

async function collectDesktop(): Promise<Array<{ name: string; pkg: string; source: string }>> {
  try {
    await access(MCP_CONFIG)
    const raw = await readFile(MCP_CONFIG, 'utf-8')
    const config = JSON.parse(raw)
    if (!config.mcpServers) return []
    return Object.entries(config.mcpServers).map(([name, server]: [string, any]) => {
      const args: string[] = server.args ?? []
      const pkg = args.find((a: string) => a.startsWith('@')) ?? server.command ?? ''
      return { name, pkg, source: 'Desktop' }
    })
  } catch {
    return []
  }
}

function parseMcpServers(servers: Record<string, any>, source: string): Array<{ name: string; pkg: string; source: string }> {
  return Object.entries(servers).map(([name, srv]: [string, any]) => {
    const args: string[] = srv.args ?? []
    const pkg = args.find((a: string) => a.startsWith('@')) ?? srv.url ?? srv.command ?? ''
    return { name, pkg, source }
  })
}

async function collectClaudeJson(): Promise<Array<{ name: string; pkg: string; source: string }>> {
  try {
    const raw = await readFile(CLAUDE_JSON, 'utf-8')
    const json = JSON.parse(raw)
    const result: Array<{ name: string; pkg: string; source: string }> = []

    // 顶层全局 MCP
    if (json.mcpServers) {
      result.push(...parseMcpServers(json.mcpServers, 'Code'))
    }

    return result
  } catch {
    return []
  }
}

export async function collectMcp(): Promise<McpInfo> {
  const [desktop, code] = await Promise.all([collectDesktop(), collectClaudeJson()])
  const servers = [...desktop, ...code]
  return { servers }
}
