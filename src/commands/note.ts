import ora from 'ora'
import { collectObsidian } from '../collectors/obsidian.js'
import { formatNote } from '../ui/render.js'

export async function runNote(): Promise<void> {
  const spinner = ora('正在读取 Obsidian 笔记库...').start()

  try {
    const obsidian = await collectObsidian()
    spinner.stop()
    formatNote(obsidian)
  } catch (err) {
    spinner.fail('读取失败')
    throw err
  }
}

export const noteCommand = {
  meta: { name: 'note', description: 'Obsidian 笔记库状态' },
  async run() {
    await runNote()
  },
}
