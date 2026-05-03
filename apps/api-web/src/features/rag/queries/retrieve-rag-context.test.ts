import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/rag/embed", () => ({
  embedTexts: vi.fn(),
}));
vi.mock("./search-similar-chunks", () => ({
  searchSimilarChunks: vi.fn(),
}));

import { embedTexts } from "@/lib/rag/embed";

import { retrieveRagContext } from "./retrieve-rag-context";
import { searchSimilarChunks } from "./search-similar-chunks";

const config = { topK: 5, similarityThreshold: 0.5 };

describe("retrieveRagContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty context when query embedding fails", async () => {
    vi.mocked(embedTexts).mockResolvedValue([]);

    const result = await retrieveRagContext("hi", "user-1", config);

    expect(result).toEqual({ system: "", sources: [] });
    expect(searchSimilarChunks).not.toHaveBeenCalled();
  });

  it("returns empty context when no similar chunks", async () => {
    vi.mocked(embedTexts).mockResolvedValue([[0.1, 0.2]]);
    vi.mocked(searchSimilarChunks).mockResolvedValue([]);

    const result = await retrieveRagContext("hi", "user-1", config);

    expect(result).toEqual({ system: "", sources: [] });
  });

  it("formats system prompt with [^cN] markers (1-indexed)", async () => {
    vi.mocked(embedTexts).mockResolvedValue([[0.1]]);
    vi.mocked(searchSimilarChunks).mockResolvedValue([
      {
        chunkId: "c-1",
        documentId: "d-1",
        documentName: "doc-a.txt",
        content: "alpha",
        charStart: 0,
        charEnd: 5,
        similarity: 0.9,
      },
      {
        chunkId: "c-2",
        documentId: "d-2",
        documentName: "doc-b.md",
        content: "beta",
        charStart: 0,
        charEnd: 4,
        similarity: 0.8,
      },
    ]);

    const result = await retrieveRagContext("q", "user-1", config);

    expect(result.system).toContain("[^c1]");
    expect(result.system).toContain("[^c2]");
    expect(result.system).toContain("doc-a.txt");
    expect(result.system).toContain("doc-b.md");
    expect(result.system).toContain("alpha");
    expect(result.system).toContain("beta");
    expect(result.system).toMatch(/<knowledge_base>[\s\S]+<\/knowledge_base>/);
  });

  it("attaches marker cN to each source (1-indexed)", async () => {
    vi.mocked(embedTexts).mockResolvedValue([[0.1]]);
    vi.mocked(searchSimilarChunks).mockResolvedValue([
      {
        chunkId: "c-1",
        documentId: "d-1",
        documentName: "a",
        content: "x",
        charStart: 0,
        charEnd: 1,
        similarity: 0.9,
      },
      {
        chunkId: "c-2",
        documentId: "d-1",
        documentName: "a",
        content: "y",
        charStart: 1,
        charEnd: 2,
        similarity: 0.8,
      },
    ]);

    const result = await retrieveRagContext("q", "user-1", config);

    expect(result.sources.map((s) => s.marker)).toEqual(["c1", "c2"]);
    expect(result.sources[0]!.chunkId).toBe("c-1");
  });

  it("passes config to searchSimilarChunks", async () => {
    vi.mocked(embedTexts).mockResolvedValue([[0.1]]);
    vi.mocked(searchSimilarChunks).mockResolvedValue([]);

    await retrieveRagContext("q", "user-7", config);

    expect(searchSimilarChunks).toHaveBeenCalledWith([0.1], "user-7", config);
  });
});
