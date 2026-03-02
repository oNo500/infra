import { readFile, readdir, access } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import type { CursorInfo } from '../ui/render.js'

const HOME = homedir()
const CURSOR_SETTINGS = join(HOME, 'Library/Application Support/Cursor/User/settings.json')
const CURSOR_PROJECTS = join(HOME, '.cursor/projects')

const exists = (p: string) =>
  access(p)
    .then(() => true)
    .catch(() => false)

export async function collectCursor(): Promise<CursorInfo> {
  const [settingsRaw, projCount] = await Promise.all([
    readFile(CURSOR_SETTINGS, 'utf-8').catch(() => null),
    readdir(CURSOR_PROJECTS)
      .then((entries) => entries.filter((e) => !e.startsWith('.')).length)
      .catch(() => 0),
  ])

  const settingsExists = settingsRaw !== null

  let formatter: string | null = null
  let aiLang: string | null = null

  if (settingsRaw) {
    try {
      const settings = JSON.parse(settingsRaw)
      formatter = settings['editor.defaultFormatter'] ?? null
      aiLang = settings['cline.preferredLanguage'] ?? null
    } catch {
      // ignore parse errors
    }
  }

  return { settingsExists, formatter, aiLang, projCount }
}
