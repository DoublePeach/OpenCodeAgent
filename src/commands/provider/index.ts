import type { Command } from '../../commands.js'
import { shouldInferenceConfigCommandBeImmediate } from '../../utils/immediateCommand.js'

export default {
  type: 'local-jsx',
  name: 'provider',
  description:
    'Switch AI vendor & model (saved to ~/.oca) · 切换模型厂商与大模型',
  aliases: ['llm', 'vendor'],
  get immediate() {
    return shouldInferenceConfigCommandBeImmediate()
  },
  load: () => import('./provider.js'),
} satisfies Command
