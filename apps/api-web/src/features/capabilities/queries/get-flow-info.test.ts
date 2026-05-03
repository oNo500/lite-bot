import { describe, expect, it } from "vitest";

import { getFlowInfo } from "./get-flow-info";

import type { ChatCapability, ChatFlow } from "@/features/chat/types";

const cap: ChatCapability = {
  id: "sample",
  meta: { name: "Sample", description: "A sample capability" },
  preStream: (ctx) => Promise.resolve(ctx),
  buildTools: () => ({}),
};

describe("getFlowInfo", () => {
  it("exposes meta + enabled + config + hook flags", () => {
    const flow: ChatFlow = {
      capabilities: [{ capability: cap, config: { foo: 1 }, enabled: true }],
      agentLoop: { maxSteps: 3 },
    };

    const info = getFlowInfo(flow);

    expect(info.capabilities).toHaveLength(1);
    expect(info.capabilities[0]!.meta.name).toBe("Sample");
    expect(info.capabilities[0]!.enabled).toBe(true);
    expect(info.capabilities[0]!.config).toEqual({ foo: 1 });
    expect(info.capabilities[0]!.hooks).toEqual({
      preStream: true,
      buildSystemPrompt: false,
      buildTools: true,
      onStreamStart: false,
    });
    expect(info.agentLoop.maxSteps).toBe(3);
  });

  it("handles disabled entries", () => {
    const flow: ChatFlow = {
      capabilities: [{ capability: cap, config: {}, enabled: false }],
      agentLoop: { maxSteps: 5 },
    };

    expect(getFlowInfo(flow).capabilities[0]!.enabled).toBe(false);
  });
});
