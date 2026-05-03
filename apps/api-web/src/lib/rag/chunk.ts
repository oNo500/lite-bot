import type { Chunk, ChunkConfig } from "./types";

export function chunkText(text: string, config: ChunkConfig): Chunk[] {
  if (!text.trim()) return [];
  if (config.strategy === "semantic") {
    throw new Error("semantic strategy not implemented yet");
  }
  return chunkFixed(text, config.size, config.overlap);
}

function chunkFixed(text: string, size: number, overlap: number): Chunk[] {
  const tokens: { word: string; charStart: number; charEnd: number }[] = [];
  const re = /\S+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    tokens.push({ word: m[0], charStart: m.index, charEnd: m.index + m[0].length });
  }
  if (tokens.length === 0) return [];

  const chunks: Chunk[] = [];
  const stride = Math.max(1, size - overlap);
  for (let start = 0; start < tokens.length; start += stride) {
    const end = Math.min(start + size, tokens.length);
    const slice = tokens.slice(start, end);
    const charStart = slice[0]!.charStart;
    const charEnd = slice.at(-1)!.charEnd;
    const content = text.slice(charStart, charEnd);
    chunks.push({
      content,
      charStart,
      charEnd,
      tokenCount: Math.ceil(content.length / 4),
    });
    if (end === tokens.length) break;
  }
  return chunks;
}
