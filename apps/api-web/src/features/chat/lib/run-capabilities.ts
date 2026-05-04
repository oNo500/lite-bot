import type { CapabilityEntry, ChatContext } from "@/features/chat/types";

export async function runCapabilities(
  entries: CapabilityEntry[],
  initialCtx: ChatContext,
): Promise<ChatContext> {
  let ctx = initialCtx;

  const active = entries.filter((e) => e.enabled);

  for (const entry of active) {
    if (entry.capability.preStream) {
      ctx = await entry.capability.preStream(ctx, entry.config);
    }
  }

  for (const entry of active) {
    if (entry.capability.buildSystemPrompt) {
      const prompt = await entry.capability.buildSystemPrompt(ctx, entry.config);
      if (prompt) ctx = { ...ctx, systemPrompts: [...ctx.systemPrompts, prompt] };
    }
    if (entry.capability.buildTools) {
      const tools = entry.capability.buildTools(ctx, entry.config);
      ctx = { ...ctx, tools: { ...ctx.tools, ...tools } };
    }
  }

  return ctx;
}
