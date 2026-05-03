import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./queries/retrieve-rag-context", () => ({
  retrieveRagContext: vi.fn(),
}));

import { capability } from "./capability";
import { retrieveRagContext } from "./queries/retrieve-rag-context";

import type { ChatContext } from "@/features/chat/types";

const baseCtx: ChatContext = {
  query: "q",
  messages: [],
  systemPrompts: [],
  tools: {},
  metadata: {},
};

const config = { topK: 5, similarityThreshold: 0.5 };

describe("rag capability", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("preStream returns ctx unchanged for anonymous users (no userId)", async () => {
    const ctx = await capability.preStream!(baseCtx, config);

    expect(ctx).toBe(baseCtx);
    expect(retrieveRagContext).not.toHaveBeenCalled();
  });

  it("preStream populates metadata.rag when authed", async () => {
    const rag = { system: "sys", sources: [{ marker: "c1" }] };
    vi.mocked(retrieveRagContext).mockResolvedValue(rag as never);

    const ctx = await capability.preStream!({ ...baseCtx, userId: "u-1" }, config);

    expect(retrieveRagContext).toHaveBeenCalledWith("q", "u-1", config);
    expect(ctx.metadata.rag).toEqual(rag);
  });

  it("buildSystemPrompt returns metadata.rag.system when present", async () => {
    const ctx: ChatContext = {
      ...baseCtx,
      metadata: { rag: { system: "sys-text", sources: [] } },
    };
    const result = await capability.buildSystemPrompt!(ctx, config);

    expect(result).toBe("sys-text");
  });

  it("buildSystemPrompt returns null when no rag metadata", async () => {
    const result = await capability.buildSystemPrompt!(baseCtx, config);

    expect(result).toBeNull();
  });

  it("buildSystemPrompt returns null when system is empty", async () => {
    const ctx: ChatContext = {
      ...baseCtx,
      metadata: { rag: { system: "", sources: [] } },
    };
    const result = await capability.buildSystemPrompt!(ctx, config);

    expect(result).toBeNull();
  });

  it("onStreamStart writes data-rag-sources part when sources present", async () => {
    const sources = [{ marker: "c1", chunkId: "x" }];
    const ctx: ChatContext = { ...baseCtx, metadata: { rag: { system: "s", sources } } };
    const writer = { write: vi.fn() };

    await capability.onStreamStart!(writer as never, ctx, config);

    expect(writer.write).toHaveBeenCalledWith(
      expect.objectContaining({ type: "data-rag-sources", data: sources }),
    );
  });

  it("onStreamStart skips when no sources", async () => {
    const writer = { write: vi.fn() };
    await capability.onStreamStart!(writer as never, baseCtx, config);

    expect(writer.write).not.toHaveBeenCalled();
  });
});
