import { readdir, readFile, access } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import type { SkillInfo } from '../ui/render.js'

const HOME = homedir()
const SKILLS_DIR = join(HOME, '.agents/skills')

const exists = (p: string) =>
  access(p)
    .then(() => true)
    .catch(() => false)

async function readDescription(skillDir: string): Promise<string | null> {
  try {
    const content = await readFile(join(skillDir, 'SKILL.md'), 'utf-8')
    // 匹配单行 description: "..." 或 description: text
    const singleLine = content.match(/^description:\s*["'](.+?)["']\s*$/m)
    if (singleLine) return singleLine[1].trim()
    const bare = content.match(/^description:\s*(?!\s*\|?\s*$)(.+)$/m)
    if (bare) return bare[1].trim()
    // 多行 block scalar (description: |)，取第一个非空缩进行
    const blockMatch = content.match(/^description:\s*\|\s*\n((?:[ \t]+.+\n?)+)/m)
    if (blockMatch) {
      const firstLine = blockMatch[1].split('\n').find((l) => l.trim())
      return firstLine ? firstLine.trim() : null
    }
    return null
  } catch {
    return null
  }
}

export async function collectSkills(): Promise<SkillInfo> {
  if (!(await exists(SKILLS_DIR))) return { skills: [] }
  try {
    const entries = (await readdir(SKILLS_DIR)).filter((e) => !e.startsWith('.')).sort()
    const skills = await Promise.all(
      entries.map(async (name) => {
        const description = await readDescription(join(SKILLS_DIR, name))
        return { name, description }
      }),
    )
    return { skills }
  } catch {
    return { skills: [] }
  }
}
