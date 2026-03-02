import { writeFile, readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { defineCommand } from 'citty'
import { intro, outro, cancel, multiselect, isCancel, spinner, log } from '@clack/prompts'
import { collectMcpSources, formatSourceHint } from '../collectors/mcp-sources.js'
import { loadWsConfig, saveMcpCache, cachedServersToMcpServers } from '../config/ws-config.js'

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

async function runMcpCollect(): Promise<void> {
  intro('ws mcp --collect')

  const s = spinner()
  s.start('正在扫描系统 MCP 服务器配置...')
  const sources = await collectMcpSources()
  s.stop('扫描完成')

  if (sources.merged.length === 0) {
    cancel('未找到任何可用的 MCP 服务器')
    process.exit(0)
  }

  const existingConfig = await loadWsConfig()
  const existingNames = new Set(Object.keys(existingConfig.mcp?.servers ?? {}))

  const options = sources.merged.map((sv) => ({
    value: sv.name,
    label: sv.name,
    hint: formatSourceHint(sv),
  }))

  const selected = await multiselect({
    message: '选择要存入缓存的服务器',
    options,
    initialValues: sources.merged.filter((sv) => existingNames.has(sv.name)).map((sv) => sv.name),
    required: false,
  })

  if (isCancel(selected)) {
    cancel('已取消')
    process.exit(0)
  }

  const selectedSet = new Set(selected as string[])
  const toCache = sources.merged.filter((sv) => selectedSet.has(sv.name))
  await saveMcpCache(toCache)

  outro(`已缓存 ${toCache.length} 个服务器 → ~/.ws.json`)
}

async function runMcpInstall(): Promise<void> {
  intro('ws mcp')

  const config = await loadWsConfig()
  const cached = cachedServersToMcpServers(config)

  if (cached.length === 0) {
    cancel('缓存为空，请先运行 ws mcp -c 收集 MCP 配置')
    process.exit(1)
  }

  const root = gitRoot()
  if (!root) {
    cancel('当前目录不在 git 项目中')
    process.exit(1)
  }

  const collectedAt = config.mcp?.collectedAt
  if (collectedAt) {
    const age = Date.now() - new Date(collectedAt).getTime()
    const hours = Math.floor(age / 3_600_000)
    if (hours >= 24) {
      log.warn(`缓存已有 ${hours} 小时，建议运行 ws mcp -c 更新`)
    }
  }

  const currentMcpPath = join(root, '.mcp.json')
  const preselectedNames = new Set<string>()
  if (existsSync(currentMcpPath)) {
    try {
      const raw = await readFile(currentMcpPath, 'utf-8')
      const json = JSON.parse(raw)
      const existing: Record<string, unknown> = json.mcpServers ?? {}
      for (const name of Object.keys(existing)) preselectedNames.add(name)
    } catch {}
  }

  const options = cached.map((s) => ({
    value: s.name,
    label: s.name,
  }))
  const initialValues = cached.filter((s) => preselectedNames.has(s.name)).map((s) => s.name)

  const selected = await multiselect({
    message: '选择要写入 .mcp.json 的服务器（空格选择，回车确认）',
    options,
    initialValues,
    required: false,
  })

  if (isCancel(selected)) {
    cancel('已取消')
    process.exit(0)
  }

  const selectedSet = new Set(selected as string[])
  const mcpServers: Record<string, unknown> = {}
  for (const server of cached) {
    if (selectedSet.has(server.name)) {
      mcpServers[server.name] = server.config
    }
  }

  await writeFile(currentMcpPath, JSON.stringify({ mcpServers }, null, 2) + '\n', 'utf-8')
  outro(`已写入 ${Object.keys(mcpServers).length} 个服务器 → .mcp.json`)
}

export const mcpCommand = defineCommand({
  meta: { name: 'mcp', description: '管理当前项目 MCP 配置' },
  args: {
    collect: { type: 'boolean', alias: 'c', description: '收集系统 MCP 配置到缓存' },
  },
  async run({ args }) {
    if (args.collect) await runMcpCollect()
    else await runMcpInstall()
  },
})
