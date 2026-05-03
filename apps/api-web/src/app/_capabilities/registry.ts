import { capability as ragCapability } from '@/features/rag/capability'
import { capability as toolsCapability } from '@/features/tools/capability'

import type { ChatCapability } from '@/features/chat/types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const registry: Record<string, ChatCapability<any>> = {
  tools: toolsCapability,
  rag: ragCapability,
}
