export interface Chunk {
  content: string
  charStart: number
  charEnd: number
  tokenCount: number
}

export interface ChunkConfig {
  strategy: 'fixed' | 'semantic'
  size: number
  overlap: number
}
