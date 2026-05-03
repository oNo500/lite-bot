import { capability as toolsCapability } from '@/features/tools/capability'

import type { ChatCapability } from '@/features/chat/types'

export const registry: Record<string, ChatCapability> = {
  tools: toolsCapability,
}
