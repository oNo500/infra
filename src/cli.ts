import { defineCommand, runMain } from 'citty'
import { runDashboard } from './commands/dashboard.js'
import { runNote } from './commands/note.js'

const main = defineCommand({
  meta: {
    name: 'ws',
    version: '0.1.0',
    description: 'AI 工具链状态看板',
  },
  args: {
    note: {
      type: 'boolean',
      alias: 'n',
      description: 'Obsidian 笔记库状态',
    },
  },
  subCommands: {
    note: () => import('./commands/note.js').then((m) => m.noteCommand),
  },
  async run({ args, rawArgs }) {
    // subCommands 匹配时 citty 仍会调用根 run，用 rawArgs 判断跳过
    if (rawArgs[0] === 'note') return
    if (args.note) {
      await runNote()
    } else {
      await runDashboard()
    }
  },
})

runMain(main)
