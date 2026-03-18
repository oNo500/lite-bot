'use client'

import { cn } from '@workspace/ui/lib/utils'
import { ChevronDown, ChevronRight, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react'
import { useState } from 'react'

export interface ReflectionResult {
  issues: string[]
  confidence: number
  suggestion?: string
}

type ReflectionState
  = | { status: 'idle' }
    | { status: 'loading' }
    | { status: 'done', result: ReflectionResult }
    | { status: 'error', message: string }

interface Props {
  state: ReflectionState
}

export function ReflectionPanel({ state }: Props) {
  const [open, setOpen] = useState(false)

  if (state.status === 'idle') return null

  if (state.status === 'loading') {
    return (
      <div className="mt-1 ml-1 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Loader2 className="size-3 animate-spin" />
        <span>自检中...</span>
      </div>
    )
  }

  if (state.status === 'error') {
    return (
      <div className="mt-1 ml-1 text-xs text-red-500">
        自检失败:
        {' '}
        {state.message}
      </div>
    )
  }

  const { result } = state
  const hasIssues = result.issues.length > 0
  const confidencePct = Math.round(result.confidence * 100)

  return (
    <div className="mt-1 ml-1 overflow-hidden rounded-md border border-border/50 text-xs">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-1.5 px-2 py-1.5 text-left transition-colors hover:bg-muted/50"
      >
        {open ? <ChevronDown className="size-3 shrink-0" /> : <ChevronRight className="size-3 shrink-0" />}
        <span className="font-medium text-muted-foreground">AI 自检</span>
        <span className="ml-auto text-muted-foreground/70">
          置信度:
          {' '}
          {confidencePct}
          %
        </span>
        {hasIssues
          ? <AlertTriangle className="size-3 shrink-0 text-amber-500" />
          : <CheckCircle className="size-3 shrink-0 text-emerald-500" />}
      </button>

      {open && (
        <div className="space-y-2 border-t border-border/50 px-3 py-2">
          {hasIssues
            ? (
                <ul className="space-y-1">
                  {result.issues.map((issue) => (
                    <li key={issue} className={cn('flex gap-1.5', 'text-amber-600 dark:text-amber-400')}>
                      <AlertTriangle className="mt-0.5 size-3 shrink-0" />
                      <span>{issue}</span>
                    </li>
                  ))}
                </ul>
              )
            : (
                <p className="flex gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle className="mt-0.5 size-3 shrink-0" />
                  <span>未发现问题</span>
                </p>
              )}
          {result.suggestion && (
            <p className="border-t border-border/50 pt-2 text-muted-foreground">
              {result.suggestion}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
