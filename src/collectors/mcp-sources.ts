import { readFile, readdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const HOME = homedir()
const CODE_DIR = join(HOME, 'code')
const CLAUDE_JSON = join(HOME, '.claude.json')

export interface McpServer {
  name: string
  source: 'project' | 'user' | 'local' | `project:${string}`
  config: Record<string, unknown>
}

export interface McpSources {
  currentProject: McpServer[]
  user: McpServer[]
  local: McpServer[]
  otherProjects: McpServer[]
  merged: McpServer[]
  gitRoot: string | null
}

function gitRoot(): string | null {
  let dir = process.cwd()
  for (let i = 0; i < 5; i++) {
    if (existsSync(join(dir, '.git'))) return dir
    const parent = join(dir, '..')
    if (parent === dir) return null
    dir = parent
  }
  return null
}

async function parseMcpJson(filePath: string, source: McpServer['source']): Promise<McpServer[]> {
  try {
    const raw = await readFile(filePath, 'utf-8')
    const json = JSON.parse(raw)
    const serversObj: Record<string, Record<string, unknown>> = json.mcpServers ?? json.servers ?? {}
    return Object.entries(serversObj).map(([name, config]) => ({ name, source, config }))
  } catch {
    return []
  }
}

async function parseClaudeJsonUser(): Promise<McpServer[]> {
  try {
    const raw = await readFile(CLAUDE_JSON, 'utf-8')
    const json = JSON.parse(raw)
    const serversObj: Record<string, Record<string, unknown>> = json.mcpServers ?? {}
    return Object.entries(serversObj).map(([name, config]) => ({ name, source: 'user', config }))
  } catch {
    return []
  }
}

async function parseClaudeJsonLocal(projectRoot: string): Promise<McpServer[]> {
  try {
    const raw = await readFile(CLAUDE_JSON, 'utf-8')
    const json = JSON.parse(raw)
    const serversObj: Record<string, Record<string, unknown>> =
      json.projects?.[projectRoot]?.mcpServers ?? {}
    return Object.entries(serversObj).map(([name, config]) => ({ name, source: 'local', config }))
  } catch {
    return []
  }
}

async function scanOtherProjects(excludeRoot: string | null): Promise<McpServer[]> {
  try {
    const entries = await readdir(CODE_DIR)
    const results = await Promise.all(
      entries.map(async (name) => {
        if (name.startsWith('.')) return []
        const projectPath = join(CODE_DIR, name)
        if (excludeRoot && projectPath === excludeRoot) return []
        const mcpPath = join(projectPath, '.mcp.json')
        return parseMcpJson(mcpPath, `project:${name}`)
      }),
    )
    return results.flat()
  } catch {
    return []
  }
}

async function scanClaudeJsonProjects(excludeRoot: string | null): Promise<McpServer[]> {
  try {
    const raw = await readFile(CLAUDE_JSON, 'utf-8')
    const json = JSON.parse(raw)
    const projects: Record<string, any> = json.projects ?? {}
    const results: McpServer[] = []
    for (const [projPath, projVal] of Object.entries(projects)) {
      if (excludeRoot && projPath === excludeRoot) continue
      const serversObj: Record<string, Record<string, unknown>> = projVal.mcpServers ?? {}
      if (Object.keys(serversObj).length === 0) continue
      const label = projPath.split('/').pop() ?? projPath
      for (const [name, config] of Object.entries(serversObj)) {
        results.push({ name, source: `project:${label}`, config })
      }
    }
    return results
  } catch {
    return []
  }
}

function merge(
  currentProject: McpServer[],
  user: McpServer[],
  local: McpServer[],
  otherProjects: McpServer[],
): McpServer[] {
  const map = new Map<string, McpServer>()
  // 优先级从低到高：otherProjects → user → local → currentProject
  for (const s of [...otherProjects, ...user, ...local, ...currentProject]) {
    map.set(s.name, s)
  }
  return Array.from(map.values())
}

export async function collectMcpSources(): Promise<McpSources> {
  const root = gitRoot()
  const [currentProject, user, local, otherProjectsMcp, otherProjectsClaude] = await Promise.all([
    root ? parseMcpJson(join(root, '.mcp.json'), 'project') : Promise.resolve([]),
    parseClaudeJsonUser(),
    root ? parseClaudeJsonLocal(root) : Promise.resolve([]),
    scanOtherProjects(root),
    scanClaudeJsonProjects(root),
  ])
  // 合并两种来源的其他项目，.mcp.json 优先（同名同项目时）
  const otherProjects = [...otherProjectsClaude, ...otherProjectsMcp]
  const merged = merge(currentProject, user, local, otherProjects)
  return { currentProject, user, local, otherProjects, merged, gitRoot: root }
}

export function formatSourceHint(server: McpServer): string {
  if (server.source === 'project') return '当前项目'
  if (server.source === 'user') return '用户级'
  if (server.source === 'local') return '本地私有'
  return server.source.replace(/^project:/, '')
}
