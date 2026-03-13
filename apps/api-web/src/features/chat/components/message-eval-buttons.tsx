'use client'

import { ThumbsDown, ThumbsUp } from 'lucide-react'
import { useOptimistic, useTransition } from 'react'

import { submitThumbsEval } from '@/app/(chat)/api/eval/actions'
import { MessageAction } from '@/components/ai-elements/message'

interface Props {
  messageId: string
  initialScore?: 1 | -1 | null
}

export function MessageEvalButtons({ messageId, initialScore = null }: Props) {
  const [, startTransition] = useTransition()
  const [optimisticScore, setOptimisticScore] = useOptimistic<1 | -1 | null>(initialScore)

  function handleVote(score: 1 | -1) {
    const next = optimisticScore === score ? null : score
    startTransition(async () => {
      setOptimisticScore(next)
      if (next !== null) {
        await submitThumbsEval(messageId, next)
      }
    })
  }

  return (
    <>
      <MessageAction
        onClick={() => handleVote(1)}
        tooltip={optimisticScore === 1 ? 'Remove upvote' : 'Good response'}
        label="Thumbs up"
        className={optimisticScore === 1 ? 'text-emerald-500' : undefined}
      >
        <ThumbsUp className="size-3" />
      </MessageAction>
      <MessageAction
        onClick={() => handleVote(-1)}
        tooltip={optimisticScore === -1 ? 'Remove downvote' : 'Bad response'}
        label="Thumbs down"
        className={optimisticScore === -1 ? 'text-red-500' : undefined}
      >
        <ThumbsDown className="size-3" />
      </MessageAction>
    </>
  )
}
