import chalk from 'chalk'

export const badgeOk   = (s: string) => `${chalk.green('●')} ${s}`
export const badgeWarn = (s: string) => `${chalk.yellow('◐')} ${s}`
export const badgeOff  = (s: string) => `${chalk.gray('○')} ${s}`

export const HR          = chalk.gray('─'.repeat(64))
export const SECTION_HR  = chalk.gray('  ' + '─'.repeat(55))
