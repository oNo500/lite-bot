import { openai } from '@ai-sdk/openai'
import { embedMany } from 'ai'

const EMBEDDING_MODEL = openai.embedding('text-embedding-3-small')

export async function embedTexts(texts: string[]): Promise<number[][]> {
  const { embeddings } = await embedMany({ model: EMBEDDING_MODEL, values: texts })
  return embeddings
}
