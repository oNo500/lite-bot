import { registry } from './registry'

import type { CapabilityEntry, ChatFlow } from '@/features/chat/types'
import type { RagConfig } from '@/features/rag/queries/types'

function entry(id: keyof typeof registry, config: unknown = {}, enabled = true): CapabilityEntry {
  return { capability: registry[id]!, config, enabled }
}

export const DEFAULT_FLOW: ChatFlow = {
  capabilities: [
    entry('tools'),
    entry('rag', { topK: 5, similarityThreshold: 0.5 } satisfies RagConfig),
  ],
  agentLoop: { maxSteps: 5 },
}
