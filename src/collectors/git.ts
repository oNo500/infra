import { readdir, access } from 'node:fs/promises'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import { homedir } from 'node:os'
import { join } from 'node:path'
import type { GitInfo } from '../ui/render.js'

const execAsync = promisify(exec)
const HOME = homedir()
const CODE_DIR = join(HOME, 'code')

const exists = (p: string) =>
  access(p)
    .then(() => true)
    .catch(() => false)

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

async function getLastCommitInfo(
  repoPath: string,
): Promise<{ relativeTime: string; timestamp: number; msg: string; branch: string } | null> {
  try {
    const [logResult, branchResult] = await Promise.all([
      execAsync('git log -1 --format="%ct|%cr|%s" HEAD', { cwd: repoPath, timeout: 3000 }),
      execAsync('git rev-parse --abbrev-ref HEAD', { cwd: repoPath, timeout: 3000 }),
    ])

    const trimmed = logResult.stdout.trim()
    if (!trimmed) return null

    const parts = trimmed.split('|')
    const tsStr = parts[0]
    const relTime = parts[1]
    // msg 可能含 '|'，取第三段及后续合并
    const msg = parts.slice(2).join('|').slice(0, 40)
    const timestamp = parseInt(tsStr, 10) * 1000
    const branch = branchResult.stdout.trim()

    return { relativeTime: relTime, timestamp, msg, branch }
  } catch {
    return null
  }
}

export async function collectGit(): Promise<GitInfo> {
  if (!(await exists(CODE_DIR))) return { projects: [] }

  let entries: string[]
  try {
    entries = await readdir(CODE_DIR)
  } catch {
    return { projects: [] }
  }

  const now = Date.now()
  const results = await Promise.all(
    entries.map(async (name) => {
      if (name.startsWith('.')) return null
      const repoPath = join(CODE_DIR, name)
      const gitDir = join(repoPath, '.git')
      if (!(await exists(gitDir))) return null
      const info = await getLastCommitInfo(repoPath)
      if (!info) return null
      if (now - info.timestamp > SEVEN_DAYS_MS) return null
      return { name, lastCommit: info.relativeTime, timestamp: info.timestamp, branch: info.branch, msg: info.msg }
    }),
  )

  const projects = results
    .filter(
      (r): r is { name: string; lastCommit: string; timestamp: number; branch: string; msg: string } => r !== null,
    )
    .sort((a, b) => b.timestamp - a.timestamp)
    .map(({ timestamp: _ts, ...rest }) => rest)

  return { projects }
}
