import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/db", () => ({
  db: {
    select: vi.fn(),
  },
}));

import { db } from "@/db";

import { searchSimilarChunks } from "./search-similar-chunks";

const mockDb = vi.mocked(db);

describe("searchSimilarChunks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns rows shaped as RetrievedChunk minus marker", async () => {
    const row = {
      chunkId: "chunk-1",
      documentId: "doc-1",
      documentName: "doc.txt",
      content: "hello world",
      charStart: 0,
      charEnd: 11,
      similarity: 0.87,
    };
    const limit = vi.fn().mockResolvedValue([row]);
    const orderBy = vi.fn().mockReturnValue({ limit });
    const where = vi.fn().mockReturnValue({ orderBy });
    const innerJoin = vi.fn().mockReturnValue({ where });
    const from = vi.fn().mockReturnValue({ innerJoin });
    mockDb.select.mockReturnValue({ from } as never);

    const result = await searchSimilarChunks([0.1, 0.2, 0.3], "user-1", {
      topK: 5,
      similarityThreshold: 0.5,
    });

    expect(mockDb.select).toHaveBeenCalled();
    expect(limit).toHaveBeenCalledWith(5);
    expect(result).toEqual([row]);
  });

  it("respects topK from config", async () => {
    const limit = vi.fn().mockResolvedValue([]);
    const orderBy = vi.fn().mockReturnValue({ limit });
    const where = vi.fn().mockReturnValue({ orderBy });
    const innerJoin = vi.fn().mockReturnValue({ where });
    const from = vi.fn().mockReturnValue({ innerJoin });
    mockDb.select.mockReturnValue({ from } as never);

    await searchSimilarChunks([0.1, 0.2], "user-2", { topK: 3, similarityThreshold: 0.7 });

    expect(limit).toHaveBeenCalledWith(3);
  });

  it("returns empty array when no chunks match", async () => {
    const limit = vi.fn().mockResolvedValue([]);
    const orderBy = vi.fn().mockReturnValue({ limit });
    const where = vi.fn().mockReturnValue({ orderBy });
    const innerJoin = vi.fn().mockReturnValue({ where });
    const from = vi.fn().mockReturnValue({ innerJoin });
    mockDb.select.mockReturnValue({ from } as never);

    const result = await searchSimilarChunks([0.1], "user-1", {
      topK: 5,
      similarityThreshold: 0.5,
    });

    expect(result).toEqual([]);
  });
});
