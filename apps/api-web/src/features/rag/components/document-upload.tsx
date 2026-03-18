'use client'

import { CloudUploadIcon } from 'lucide-react'
import { useRef, useState } from 'react'
import { toast } from 'sonner'

import { useUploadDocument } from '../hooks/use-documents'

const ACCEPTED_TYPES = new Set(['text/plain', 'text/markdown', 'application/pdf', 'application/json'])
const ACCEPTED_EXTS = '.txt,.md,.pdf,.json'

export function DocumentUpload() {
  const { mutateAsync: upload, isPending } = useUploadDocument()
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    const file = files[0]!
    if (!ACCEPTED_TYPES.has(file.type)) {
      toast.error('仅支持 PDF、TXT、MD 格式')
      return
    }
    try {
      await upload(file)
      toast.success(`${file.name} 上传成功，正在后台处理`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '上传失败')
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragOver(false)
    void handleFiles(e.dataTransfer.files)
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="上传文档"
      className={[
        'relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors cursor-pointer',
        isDragOver
          ? 'border-primary bg-primary/5'
          : 'border-border hover:border-primary/50 hover:bg-muted/30',
        isPending ? 'pointer-events-none opacity-60' : '',
      ].join(' ')}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault()
        setIsDragOver(true)
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_EXTS}
        className="sr-only"
        onChange={(e) => void handleFiles(e.target.files)}
      />
      <div className="flex size-12 items-center justify-center rounded-full bg-muted">
        <CloudUploadIcon className={`size-6 ${isPending ? 'animate-pulse' : ''} text-muted-foreground`} />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium">
          {isPending ? '上传中...' : '拖拽文件或点击上传'}
        </p>
        <p className="text-xs text-muted-foreground">支持 PDF、TXT、MD、JSON，最大 10MB</p>
      </div>
    </div>
  )
}
