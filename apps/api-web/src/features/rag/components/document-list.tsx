'use client'

import { Skeleton } from '@workspace/ui/components/skeleton'
import { FolderOpenIcon } from 'lucide-react'

import { DocumentItem } from './document-item'
import { useDocuments } from '../hooks/use-documents'

export function DocumentList() {
  const { data: docs, isLoading, error } = useDocuments()

  if (isLoading) {
    return (
      <div className="divide-y">
        {(['a', 'b', 'c'] as const).map((k) => (
          <div key={k} className="flex items-center gap-3 px-4 py-3">
            <Skeleton className="size-4 rounded" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-5 w-12 rounded-full" />
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="px-4 py-8 text-center text-sm text-destructive">
        加载失败，请刷新重试
      </div>
    )
  }

  if (!docs || docs.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 px-4 py-12 text-muted-foreground">
        <FolderOpenIcon className="size-8 opacity-40" />
        <p className="text-sm">暂无文档，上传第一个文件开始吧</p>
      </div>
    )
  }

  return (
    <div className="divide-y">
      {docs.map((doc) => (
        <DocumentItem key={doc.id} doc={doc} />
      ))}
    </div>
  )
}
