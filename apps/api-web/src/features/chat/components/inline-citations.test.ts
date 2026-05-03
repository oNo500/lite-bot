import { describe, expect, it } from 'vitest'

import { splitCitationSegments } from './inline-citations'

import type { RetrievedChunk } from '@/features/rag/queries/types'

const baseSource: Omit<RetrievedChunk, 'marker'> = {
  chunkId: 'chunk-1',
  documentId: 'doc-1',
  documentName: 'doc.md',
  content: 'snippet',
  charStart: 0,
  charEnd: 7,
  similarity: 0.9,
}

const sources: RetrievedChunk[] = [
  { ...baseSource, marker: 'c1' },
  { ...baseSource, marker: 'c2', chunkId: 'chunk-2' },
]

describe('splitCitationSegments', () => {
  it('returns empty array for empty text', () => {
    expect(splitCitationSegments('', sources)).toEqual([])
  })

  it('returns single text segment when no markers present', () => {
    expect(splitCitationSegments('plain text', sources)).toEqual([
      { kind: 'text', value: 'plain text' },
    ])
  })

  it('splits text and matches valid markers', () => {
    const result = splitCitationSegments('See [^c1] and [^c2] for details.', sources)
    expect(result).toEqual([
      { kind: 'text', value: 'See ' },
      { kind: 'citation', value: '[^c1]', marker: 'c1' },
      { kind: 'text', value: ' and ' },
      { kind: 'citation', value: '[^c2]', marker: 'c2' },
      { kind: 'text', value: ' for details.' },
    ])
  })

  it('flags hallucinated markers without matching source', () => {
    const result = splitCitationSegments('Check [^c99] reference.', sources)
    expect(result).toEqual([
      { kind: 'text', value: 'Check ' },
      { kind: 'unknown-marker', value: '[^c99]' },
      { kind: 'text', value: ' reference.' },
    ])
  })

  it('handles consecutive markers', () => {
    const result = splitCitationSegments('Multiple[^c1][^c2] cites.', sources)
    expect(result).toEqual([
      { kind: 'text', value: 'Multiple' },
      { kind: 'citation', value: '[^c1]', marker: 'c1' },
      { kind: 'citation', value: '[^c2]', marker: 'c2' },
      { kind: 'text', value: ' cites.' },
    ])
  })
})
