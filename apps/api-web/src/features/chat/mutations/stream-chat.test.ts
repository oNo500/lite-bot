import { describe, expect, it, vi } from "vitest";

vi.mock("ai", async (importOriginal) => {
  const actual = await importOriginal<typeof AiModule>();
  return {
    ...actual,
    streamText: vi.fn(() => ({ toUIMessageStream: () => ({}) })),
  };
});
vi.mock("@/db/chat-queries", () => ({ ensureChat: vi.fn(), saveMessages: vi.fn() }));
vi.mock("@/lib/ai/provider", () => ({ model: "mock" }));
vi.mock("@/app/(chat)/api/chat/_lib/prepare-model-messages", () => ({
  prepareModelMessages: (m: unknown) => Promise.resolve(m),
}));

import { streamChat } from "./stream-chat";

import type { ChatFlow } from "../types";
import type * as AiModule from "ai";

describe("streamChat", () => {
  const baseFlow: ChatFlow = { capabilities: [], agentLoop: { maxSteps: 5 } };

  it("returns a Response without capabilities", async () => {
    const res = await streamChat({
      flow: baseFlow,
      messages: [{ id: "1", role: "user", parts: [{ type: "text", text: "hi" }] }] as never,
      query: "hi",
    });

    expect(res).toBeInstanceOf(Response);
  });
});
