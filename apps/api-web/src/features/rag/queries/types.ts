export interface RetrievedChunk {
  marker: string;
  chunkId: string;
  documentId: string;
  documentName: string;
  content: string;
  charStart: number;
  charEnd: number;
  similarity: number;
}

export interface RagContext {
  system: string;
  sources: RetrievedChunk[];
}

export interface RagConfig {
  topK: number;
  similarityThreshold: number;
}
