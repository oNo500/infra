import { readdir, access } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import type { SkillInfo } from '../ui/render.js'

const HOME = homedir()
const SKILLS_DIR = join(HOME, '.agents/skills')

const exists = (p: string) =>
  access(p)
    .then(() => true)
    .catch(() => false)

export async function collectSkills(): Promise<SkillInfo> {
  if (!(await exists(SKILLS_DIR))) return { names: [] }
  try {
    const entries = await readdir(SKILLS_DIR)
    const names = entries.filter((e) => !e.startsWith('.')).sort()
    return { names }
  } catch {
    return { names: [] }
  }
}
