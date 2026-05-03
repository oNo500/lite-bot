import { aiTools } from '@/lib/ai/tools'

import type { ChatCapability } from '@/features/chat/types'

export const capability: ChatCapability = {
  id: 'tools',
  buildTools: () => aiTools,
}
