'use client'

import { Button } from '@workspace/ui/components/button'
import { FileTextIcon, Loader2Icon, Trash2Icon } from 'lucide-react'

import { useDeleteDocument } from '../hooks/use-documents'

import type { DocumentStatus, RagDocument } from '../hooks/use-documents'

const STATUS_LABEL: Record<DocumentStatus, string> = {
  pending: '等待中',
  processing: '处理中',
  ready: '就绪',
  error: '失败',
}

const STATUS_CLASS: Record<DocumentStatus, string> = {
  pending: 'text-muted-foreground border border-border',
  processing: 'text-blue-600 border border-blue-200 bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:bg-blue-950',
  ready: 'text-green-700 border border-green-200 bg-green-50 dark:text-green-400 dark:border-green-800 dark:bg-green-950',
  error: 'text-destructive border border-destructive/30 bg-destructive/10',
}

export function DocumentItem({ doc }: { doc: RagDocument }) {
  const { mutate: deleteDoc, isPending } = useDeleteDocument()
  const isProcessing = doc.status === 'pending' || doc.status === 'processing'
  const sizeKb = (doc.size / 1024).toFixed(1)

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b last:border-b-0 hover:bg-muted/30 transition-colors">
      <FileTextIcon className="size-4 text-muted-foreground shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-medium">{doc.name}</p>
        <p className="text-xs text-muted-foreground">
          {sizeKb}
          {' '}
          KB
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {isProcessing && <Loader2Icon className="size-3.5 animate-spin text-muted-foreground" />}
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASS[doc.status]}`}>
          {STATUS_LABEL[doc.status]}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          disabled={isPending}
          onClick={() => deleteDoc(doc.id)}
          aria-label="删除文档"
        >
          <Trash2Icon className="size-3.5" />
        </Button>
      </div>
    </div>
  )
}
