import type { Command } from '../../commands.js'

const language = {
  type: 'local-jsx',
  name: 'language',
  description: 'Switch UI language / 切换界面语言',
  aliases: ['lang'],
  load: () => import('./language.js'),
} satisfies Command

export default language
