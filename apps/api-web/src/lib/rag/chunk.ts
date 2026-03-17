const CHUNK_SIZE = 512
const CHUNK_OVERLAP = 64

export function chunkText(text: string): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  const chunks: string[] = []
  let start = 0

  while (start < words.length) {
    const end = Math.min(start + CHUNK_SIZE, words.length)
    chunks.push(words.slice(start, end).join(' '))
    if (end === words.length) break
    start += CHUNK_SIZE - CHUNK_OVERLAP
  }

  return chunks
}
