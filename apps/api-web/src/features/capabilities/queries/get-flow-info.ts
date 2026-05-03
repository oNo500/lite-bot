import type { CapabilityMeta, ChatFlow } from "@/features/chat/types";

export interface CapabilityInfo {
  id: string;
  meta: CapabilityMeta;
  enabled: boolean;
  config: unknown;
  hooks: {
    preStream: boolean;
    buildSystemPrompt: boolean;
    buildTools: boolean;
    onStreamStart: boolean;
  };
}

export interface FlowInfo {
  capabilities: CapabilityInfo[];
  agentLoop: { maxSteps: number };
  model?: string;
}

export function getFlowInfo(flow: ChatFlow): FlowInfo {
  return {
    capabilities: flow.capabilities.map((entry) => ({
      id: entry.capability.id,
      meta: entry.capability.meta,
      enabled: entry.enabled,
      config: entry.config,
      hooks: {
        preStream: Boolean(entry.capability.preStream),
        buildSystemPrompt: Boolean(entry.capability.buildSystemPrompt),
        buildTools: Boolean(entry.capability.buildTools),
        onStreamStart: Boolean(entry.capability.onStreamStart),
      },
    })),
    agentLoop: flow.agentLoop,
    model: flow.model,
  };
}
