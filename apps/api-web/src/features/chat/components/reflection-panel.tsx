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
      <div className="flex items-center gap-1.5 mt-1 ml-1 text-xs text-muted-foreground">
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
    <div className="mt-1 ml-1 text-xs border border-border/50 rounded-md overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-1.5 px-2 py-1.5 text-left hover:bg-muted/50 transition-colors"
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
          ? <AlertTriangle className="size-3 text-amber-500 shrink-0" />
          : <CheckCircle className="size-3 text-emerald-500 shrink-0" />}
      </button>

      {open && (
        <div className="px-3 py-2 border-t border-border/50 space-y-2">
          {hasIssues
            ? (
                <ul className="space-y-1">
                  {result.issues.map((issue) => (
                    <li key={issue} className={cn('flex gap-1.5', 'text-amber-600 dark:text-amber-400')}>
                      <AlertTriangle className="size-3 mt-0.5 shrink-0" />
                      <span>{issue}</span>
                    </li>
                  ))}
                </ul>
              )
            : (
                <p className="flex gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle className="size-3 mt-0.5 shrink-0" />
                  <span>未发现问题</span>
                </p>
              )}
          {result.suggestion && (
            <p className="text-muted-foreground border-t border-border/50 pt-2">
              {result.suggestion}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
