import { readFile, access } from 'node:fs/promises'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import { homedir } from 'node:os'
import { join } from 'node:path'
import type { ClaudeInfo } from '../ui/render.js'

const execAsync = promisify(exec)
const HOME = homedir()

export async function collectClaude(): Promise<ClaudeInfo> {
  const [versionResult, settingsRaw] = await Promise.all([
    execAsync('claude --version').catch(() => null),
    readFile(join(HOME, '.claude/settings.json'), 'utf-8').catch(() => null),
  ])

  const version = versionResult ? versionResult.stdout.trim() : null

  let model: string | null = null
  let language: string | null = null
  let skipDangerousMode = false

  if (settingsRaw) {
    try {
      const settings = JSON.parse(settingsRaw)
      model = settings.model ?? null
      language = settings.language ?? null
      skipDangerousMode = settings.skipDangerousModePermissionPrompt === true
    } catch {
      // ignore parse errors
    }
  }

  return { version, model, language, skipDangerousMode }
}
