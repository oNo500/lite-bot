import type { ToolSet, UIMessageStreamWriter } from 'ai'

export interface ChatContext {
  userId?: string
  chatId?: string
  query: string
  messages: unknown[]
  systemPrompts: string[]
  tools: ToolSet
  metadata: Record<string, unknown>
}

export interface CapabilityMeta {
  name: string
  description: string
}

export interface ChatCapability<TConfig = unknown> {
  id: string
  meta: CapabilityMeta
  preStream?: (ctx: ChatContext, config: TConfig) => Promise<ChatContext>
  buildSystemPrompt?: (ctx: ChatContext, config: TConfig) => Promise<string | null>
  buildTools?: (ctx: ChatContext, config: TConfig) => ToolSet
  onStreamStart?: (writer: UIMessageStreamWriter, ctx: ChatContext, config: TConfig) => Promise<void>
}

export interface CapabilityEntry<TConfig = unknown> {
  capability: ChatCapability<TConfig>
  config: TConfig
  enabled: boolean
}

export interface ChatFlow {
  capabilities: CapabilityEntry[]
  agentLoop: { maxSteps: number }
  model?: string
}
