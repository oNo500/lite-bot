'use client'

import { DocumentList } from './components/document-list'
import { DocumentUpload } from './components/document-upload'

export function RagPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">知识库管理</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          上传文档后，在聊天界面开启知识库开关，AI 将参考这些文档回答你的问题。
        </p>
      </div>

      <div className="space-y-6">
        <DocumentUpload />

        <div className="rounded-xl border bg-card">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h2 className="text-sm font-medium">已上传文档</h2>
          </div>
          <DocumentList />
        </div>
      </div>
    </div>
  )
}
