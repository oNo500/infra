import ora from 'ora'
import { collectClaude } from '../collectors/claude.js'
import { collectMcp } from '../collectors/mcp.js'
import { collectCursor } from '../collectors/cursor.js'
import { collectSkills } from '../collectors/skills.js'
import { collectGit } from '../collectors/git.js'
import { collectProject } from '../collectors/project.js'
import { formatDashboard } from '../ui/render.js'

export async function runDashboard(): Promise<void> {
  const spinner = ora('正在检测工具链状态...').start()

  try {
    const [claude, mcp, cursor, skills, git, project] = await Promise.all([
      collectClaude(),
      collectMcp(),
      collectCursor(),
      collectSkills(),
      collectGit(),
      collectProject(),
    ])
    spinner.stop()
    formatDashboard({ claude, mcp, cursor, skills, git, project })
  } catch (err) {
    spinner.fail('采集失败')
    throw err
  }
}
