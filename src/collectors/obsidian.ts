import { readdir, stat, access } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import type { ObsidianInfo } from '../ui/render.js'

const HOME = homedir()
const VAULT = join(
  HOME,
  'Library/Mobile Documents/iCloud~md~obsidian/Documents/notes',
)
const INBOX_DIR = join(VAULT, 'inbox')

const exists = (p: string) =>
  access(p)
    .then(() => true)
    .catch(() => false)

async function countMdFiles(dir: string): Promise<number> {
  let count = 0
  try {
    const entries = await readdir(dir, { withFileTypes: true })
    await Promise.all(
      entries.map(async (entry) => {
        if (entry.name.startsWith('.')) return
        if (entry.isDirectory()) {
          count += await countMdFiles(join(dir, entry.name))
        } else if (entry.name.endsWith('.md')) {
          count++
        }
      }),
    )
  } catch {
    // ignore unreadable dirs
  }
  return count
}

async function getRecentNotes(dir: string, limit = 5): Promise<string[]> {
  const files: Array<{ name: string; mtime: number }> = []

  async function walk(current: string) {
    try {
      const entries = await readdir(current, { withFileTypes: true })
      await Promise.all(
        entries.map(async (entry) => {
          if (entry.name.startsWith('.')) return
          const fullPath = join(current, entry.name)
          if (entry.isDirectory()) {
            await walk(fullPath)
          } else if (entry.name.endsWith('.md')) {
            try {
              const s = await stat(fullPath)
              files.push({ name: entry.name.replace(/\.md$/, ''), mtime: s.mtimeMs })
            } catch {
              // ignore
            }
          }
        }),
      )
    } catch {
      // ignore
    }
  }

  await walk(dir)
  return files
    .sort((a, b) => b.mtime - a.mtime)
    .slice(0, limit)
    .map((f) => f.name)
}

export async function collectObsidian(): Promise<ObsidianInfo> {
  if (!(await exists(VAULT))) {
    return { exists: false, inboxCount: 0, recentNotes: [], folders: [] }
  }

  // 扫描顶层目录
  let topEntries: import('node:fs').Dirent[] = []
  try {
    const { readdir: rd } = await import('node:fs/promises')
    topEntries = await rd(VAULT, { withFileTypes: true })
  } catch {
    // ignore
  }

  const topDirs = topEntries
    .filter((e) => e.isDirectory() && !e.name.startsWith('.'))
    .map((e) => e.name)
    .sort()

  const [inboxCount, recentNotes, folderCounts] = await Promise.all([
    exists(INBOX_DIR).then((ok) => (ok ? countMdFiles(INBOX_DIR) : 0)),
    getRecentNotes(VAULT),
    Promise.all(
      topDirs.map(async (name) => {
        const count = await countMdFiles(join(VAULT, name))
        const warn = name === 'inbox' && count > 10
        return { name, count, warn }
      }),
    ),
  ])

  return { exists: true, inboxCount, recentNotes, folders: folderCounts }
}
