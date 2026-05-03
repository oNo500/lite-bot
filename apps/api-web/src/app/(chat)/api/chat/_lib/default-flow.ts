import { registry } from './registry'

import type { CapabilityEntry, ChatFlow } from '@/features/chat/types'

function entry(id: keyof typeof registry, config: unknown = {}, enabled = true): CapabilityEntry {
  return { capability: registry[id]!, config, enabled }
}

export const DEFAULT_FLOW: ChatFlow = {
  capabilities: [
    entry('tools'),
  ],
  agentLoop: { maxSteps: 5 },
}
