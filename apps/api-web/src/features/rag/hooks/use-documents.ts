'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { appPaths } from '@/config/app-paths'

export type DocumentStatus = 'pending' | 'processing' | 'ready' | 'error'

export interface RagDocument {
  id: string
  name: string
  mimeType: string
  size: number
  status: DocumentStatus
  errorMessage: string | null
  createdAt: string
  updatedAt: string
}

async function fetchDocuments(): Promise<RagDocument[]> {
  const res = await fetch(appPaths.api.rag.documents.href)
  if (!res.ok) throw new Error('Failed to fetch documents')
  return res.json() as Promise<RagDocument[]>
}

function hasProcessingDocs(docs: RagDocument[]): boolean {
  return docs.some((d) => d.status === 'pending' || d.status === 'processing')
}

export function useDocuments() {
  return useQuery({
    queryKey: ['rag-documents'],
    queryFn: fetchDocuments,
    refetchInterval: (query) => {
      const data = query.state.data
      return data && hasProcessingDocs(data) ? 2000 : false
    },
  })
}

export function useUploadDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch(appPaths.api.rag.documents.href, {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Upload failed' })) as { error?: string }
        throw new Error(err.error ?? 'Upload failed')
      }
      return res.json() as Promise<RagDocument>
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['rag-documents'] })
    },
  })
}

export function useDeleteDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(appPaths.api.rag.document.href(id), { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['rag-documents'] })
    },
  })
}
