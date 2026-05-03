import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/db", () => ({
  db: {
    select: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    insert: vi.fn(),
  },
}));
vi.mock("@/lib/rag/chunk", () => ({
  chunkText: vi.fn(),
}));
vi.mock("@/lib/rag/embed", () => ({
  embedTexts: vi.fn(),
}));

import { db } from "@/db";
import { chunkText } from "@/lib/rag/chunk";
import { embedTexts } from "@/lib/rag/embed";

import { rechunkDocument } from "./rechunk-document";

const mockDb = vi.mocked(db);

interface DocRow {
  id: string;
  rawContent: string | null;
}

function setupSelect(rows: DocRow[]): void {
  const limit = vi.fn().mockResolvedValue(rows);
  const where = vi.fn().mockReturnValue({ limit });
  const from = vi.fn().mockReturnValue({ where });
  mockDb.select.mockReturnValue({ from } as never);
}

function setupUpdate(): { set: ReturnType<typeof vi.fn> } {
  const where = vi.fn().mockResolvedValue(undefined as never);
  const set = vi.fn().mockReturnValue({ where });
  mockDb.update.mockReturnValue({ set } as never);
  return { set };
}

function setupDelete(): ReturnType<typeof vi.fn> {
  const where = vi.fn().mockResolvedValue(undefined as never);
  mockDb.delete.mockReturnValue({ where } as never);
  return where;
}

function setupInsert(): ReturnType<typeof vi.fn> {
  const values = vi.fn().mockResolvedValue(undefined as never);
  mockDb.insert.mockReturnValue({ values } as never);
  return values;
}

describe("rechunkDocument", () => {
  const cfg = { strategy: "fixed" as const, size: 5, overlap: 1 };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns not-found when doc missing or cross-user", async () => {
    setupSelect([]);

    const result = await rechunkDocument({ documentId: "x", userId: "u", config: cfg });

    expect(result).toEqual({ ok: false, reason: "not-found" });
    expect(chunkText).not.toHaveBeenCalled();
  });

  it("returns no-raw-content when rawContent is null", async () => {
    setupSelect([{ id: "doc-1", rawContent: null }]);

    const result = await rechunkDocument({ documentId: "doc-1", userId: "u", config: cfg });

    expect(result).toEqual({ ok: false, reason: "no-raw-content" });
    expect(chunkText).not.toHaveBeenCalled();
  });

  it("deletes existing chunks then inserts re-chunked rows", async () => {
    setupSelect([{ id: "doc-1", rawContent: "hello world" }]);
    setupUpdate();
    const deleteWhere = setupDelete();
    const insertValues = setupInsert();
    vi.mocked(chunkText).mockReturnValue([
      { content: "hello", charStart: 0, charEnd: 5, tokenCount: 1 },
      { content: "world", charStart: 6, charEnd: 11, tokenCount: 1 },
    ]);
    vi.mocked(embedTexts).mockResolvedValue([[0.1], [0.2]]);

    const result = await rechunkDocument({ documentId: "doc-1", userId: "u", config: cfg });

    expect(result).toEqual({ ok: true });
    expect(deleteWhere).toHaveBeenCalled();
    expect(chunkText).toHaveBeenCalledWith("hello world", cfg);
    expect(embedTexts).toHaveBeenCalledWith(["hello", "world"]);
    const rows = insertValues.mock.calls[0]![0] as { content: string; embedding: number[] }[];
    expect(rows).toHaveLength(2);
    expect(rows[0]!.embedding).toEqual([0.1]);
    expect(rows[1]!.embedding).toEqual([0.2]);
  });

  it("persists chunkConfig on the document", async () => {
    setupSelect([{ id: "doc-1", rawContent: "hi" }]);
    const { set } = setupUpdate();
    setupDelete();
    setupInsert();
    vi.mocked(chunkText).mockReturnValue([
      { content: "hi", charStart: 0, charEnd: 2, tokenCount: 1 },
    ]);
    vi.mocked(embedTexts).mockResolvedValue([[0.5]]);

    await rechunkDocument({ documentId: "doc-1", userId: "u", config: cfg });

    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({ status: "processing", chunkConfig: cfg }),
    );
  });

  it("handles empty chunk output without inserting", async () => {
    setupSelect([{ id: "doc-1", rawContent: "   " }]);
    setupUpdate();
    setupDelete();
    const insertValues = setupInsert();
    vi.mocked(chunkText).mockReturnValue([]);

    const result = await rechunkDocument({ documentId: "doc-1", userId: "u", config: cfg });

    expect(result).toEqual({ ok: true });
    expect(embedTexts).not.toHaveBeenCalled();
    expect(insertValues).not.toHaveBeenCalled();
  });
});
