'use client'

import { motion } from 'framer-motion'
import { memo } from 'react'

import type { TextUIPart } from 'ai'

interface SuggestedActionsProps {
  onSend: (parts: TextUIPart[]) => void
}

const SUGGESTIONS = [
  'What are the advantages of using Next.js?',
  'Write code to demonstrate Dijkstra\'s algorithm',
  'Help me write an essay about Silicon Valley',
  'What is the weather in San Francisco?',
]

function PureSuggestedActions({ onSend }: SuggestedActionsProps) {
  return (
    <div className="grid w-full gap-2 sm:grid-cols-2 mb-3">
      {SUGGESTIONS.map((text, index) => (
        <motion.button
          key={text}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 * index }}
          type="button"
          onClick={() => onSend([{ type: 'text', text }])}
          className="h-auto w-full whitespace-normal rounded-xl border p-3 text-left text-sm hover:bg-muted transition-colors"
        >
          {text}
        </motion.button>
      ))}
    </div>
  )
}

export const SuggestedActions = memo(PureSuggestedActions)
