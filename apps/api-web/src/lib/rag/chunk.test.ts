import { describe, expect, it } from "vitest";

import { chunkText } from "./chunk";

describe("chunkText (fixed)", () => {
  const cfg = { strategy: "fixed", size: 5, overlap: 1 } as const;

  it("content slices back from offsets", () => {
    const text = "one two three four five six seven eight nine ten";
    const chunks = chunkText(text, cfg);
    for (const c of chunks) {
      expect(text.slice(c.charStart, c.charEnd)).toBe(c.content);
    }
  });

  it("covers full text", () => {
    const text = "a b c d e f g h i j";
    const chunks = chunkText(text, cfg);
    expect(chunks[0]!.charStart).toBe(0);
    expect(chunks.at(-1)!.charEnd).toBe(text.length);
  });

  it("reports positive token count", () => {
    const chunks = chunkText("hello world this is a test sentence", cfg);
    for (const c of chunks) expect(c.tokenCount).toBeGreaterThan(0);
  });

  it("empty input returns empty array", () => {
    expect(chunkText("", cfg)).toEqual([]);
  });
});

describe("chunkText (semantic)", () => {
  it("throws not-implemented", () => {
    expect(() => chunkText("hi", { strategy: "semantic", size: 5, overlap: 1 })).toThrow(
      /not implemented/i,
    );
  });
});
