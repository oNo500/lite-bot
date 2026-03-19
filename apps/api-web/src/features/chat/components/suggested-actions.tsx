'use client'

import { Button } from '@workspace/ui/components/button'
import { cn } from '@workspace/ui/lib/utils'
import {
  FileTextIcon,
  HelpCircleIcon,
  NewspaperIcon,
  ScaleIcon,
  SearchIcon,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { usePromptInputController } from '@/components/ai-elements/prompt-input'

import type { TextUIPart } from 'ai'
import type { LucideIcon } from 'lucide-react'

interface ActionCategory {
  icon: LucideIcon
  label: string
  key: string
}

const ACTION_CATEGORIES: ActionCategory[] = [
  { icon: SearchIcon, label: 'Research', key: 'research' },
  { icon: ScaleIcon, label: 'Compare', key: 'compare' },
  { icon: NewspaperIcon, label: 'Latest', key: 'latest' },
  { icon: FileTextIcon, label: 'Summarize', key: 'summarize' },
  { icon: HelpCircleIcon, label: 'Explain', key: 'explain' },
]

const PROMPT_SAMPLES: Record<string, string[]> = {
  research: [
    'Why is Nvidia growing so rapidly?',
    'Research the latest AI developments',
    'What are the key trends in robotics?',
    'What are the latest breakthroughs in renewable energy?',
  ],
  compare: [
    'Tesla vs BYD vs Toyota comparison',
    'Compare Next.js, Remix, and Astro',
    'AWS vs GCP vs Azure',
    'iPhone vs Android ecosystem comparison',
  ],
  latest: [
    'Latest news today',
    'What happened in tech this week?',
    'Recent breakthroughs in medicine',
    'Latest AI model releases',
  ],
  summarize: [
    'Summarize this week\'s business news',
    'Create an executive summary of AI trends',
    'Summarize recent climate change research',
    'TL;DR the latest developments in quantum computing',
  ],
  explain: [
    'Explain neural networks simply',
    'How does blockchain work?',
    'What is quantum entanglement?',
    'Explain CRISPR gene editing',
  ],
}

interface SuggestedActionsProps {
  onSend: (parts: TextUIPart[]) => void
}

export function SuggestedActions({ onSend }: SuggestedActionsProps) {
  const { textInput } = usePromptInputController()
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  function handleCategoryClick(category: ActionCategory) {
    setActiveCategory(category.key)
    textInput.setInput(category.label)
  }

  function handlePromptClick(prompt: string) {
    setActiveCategory(null)
    textInput.clear()
    onSend([{ type: 'text', text: prompt }])
  }

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && activeCategory) {
        setActiveCategory(null)
      }
    }

    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setActiveCategory(null)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [activeCategory])

  return (
    <div ref={containerRef} className="relative mt-2 h-45">
      {/* Category pills */}
      <div
        className={cn(
          'absolute inset-0 flex items-start justify-center pt-2 transition-opacity duration-200',
          activeCategory ? 'pointer-events-none opacity-0' : 'opacity-100',
        )}
      >
        <div className="flex flex-wrap justify-center gap-2">
          {ACTION_CATEGORIES.map((category) => {
            const Icon = category.icon
            return (
              <Button
                key={category.key}
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={() => handleCategoryClick(category)}
              >
                <Icon className="size-4" />
                {category.label}
              </Button>
            )
          })}
        </div>
      </div>

      {/* Prompt samples */}
      <div
        className={cn(
          'absolute inset-0 space-y-1 overflow-y-auto py-1 transition-opacity duration-200',
          activeCategory ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      >
        {activeCategory && PROMPT_SAMPLES[activeCategory]?.map((prompt) => (
          <button
            key={prompt}
            type="button"
            className="group flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
            onClick={() => handlePromptClick(prompt)}
          >
            <SearchIcon className="size-3 shrink-0 text-muted-foreground group-hover:text-foreground" />
            <span className="line-clamp-1">{prompt}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
