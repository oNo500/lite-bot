import { convertToModelMessages, pruneMessages } from 'ai'

import type { ModelMessage, UIMessage } from 'ai'

export async function prepareModelMessages(messages: UIMessage[]): Promise<ModelMessage[]> {
  const modelMessages = await convertToModelMessages(messages)
  return pruneMessages({
    messages: modelMessages,
    reasoning: 'before-last-message',
    toolCalls: 'before-last-2-messages',
  })
}
