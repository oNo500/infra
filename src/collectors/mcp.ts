import { readFile, access } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import type { McpInfo } from '../ui/render.js'

const HOME = homedir()
const MCP_CONFIG = join(HOME, 'Library/Application Support/Claude/claude_desktop_config.json')

export async function collectMcp(): Promise<McpInfo> {
  try {
    await access(MCP_CONFIG)
    const raw = await readFile(MCP_CONFIG, 'utf-8')
    const config = JSON.parse(raw)
    if (!config.mcpServers) return { servers: [] }

    const servers = Object.entries(config.mcpServers).map(([name, server]: [string, any]) => {
      const args: string[] = server.args ?? []
      const pkg = args.find((a: string) => a.startsWith('@')) ?? server.command ?? ''
      return { name, pkg }
    })

    return { servers }
  } catch {
    return { servers: [] }
  }
}
