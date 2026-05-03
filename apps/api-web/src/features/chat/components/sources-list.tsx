'use client'

import { Source, Sources, SourcesContent, SourcesTrigger } from '@/components/ai-elements/sources'
import { appPaths } from '@/config/app-paths'

import type { RetrievedChunk } from '@/features/rag/queries/types'

interface SourcesListProps {
  sources: RetrievedChunk[]
}

export function SourcesList({ sources }: SourcesListProps) {
  if (sources.length === 0) return null
  return (
    <Sources>
      <SourcesTrigger count={sources.length} />
      <SourcesContent>
        {sources.map((s) => (
          <Source
            key={s.chunkId}
            href={appPaths.rag.detail.href(s.documentId, s.chunkId)}
            title={s.documentName}
          />
        ))}
      </SourcesContent>
    </Sources>
  )
}
