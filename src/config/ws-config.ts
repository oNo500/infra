import { readFile, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import type { McpServer } from '../collectors/mcp-sources.js'

const CONFIG_PATH = join(homedir(), '.ws.json')

interface WsConfig {
  mcp?: {
    servers?: Record<string, Record<string, unknown>>
    collectedAt?: string
  }
}

export async function loadWsConfig(): Promise<WsConfig> {
  try {
    const raw = await readFile(CONFIG_PATH, 'utf-8')
    return JSON.parse(raw) as WsConfig
  } catch {
    return {}
  }
}

export async function saveMcpCache(servers: McpServer[]): Promise<void> {
  const existing = await loadWsConfig()
  const serversMap: Record<string, Record<string, unknown>> = {}
  for (const s of servers) {
    serversMap[s.name] = s.config
  }
  const updated: WsConfig = {
    ...existing,
    mcp: {
      servers: serversMap,
      collectedAt: new Date().toISOString(),
    },
  }
  await writeFile(CONFIG_PATH, JSON.stringify(updated, null, 2) + '\n', 'utf-8')
}

export function cachedServersToMcpServers(config: WsConfig): McpServer[] {
  const servers = config.mcp?.servers ?? {}
  return Object.entries(servers).map(([name, cfg]) => ({
    name,
    source: 'user' as const,
    config: cfg,
  }))
}
