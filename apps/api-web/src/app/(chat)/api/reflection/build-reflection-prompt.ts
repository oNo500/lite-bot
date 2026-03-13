interface Params {
  userMessage: string
  assistantMessage: string
}

export function buildReflectionPrompt({ userMessage, assistantMessage }: Params): string {
  return `You are reviewing your own previous response for accuracy, completeness, and helpfulness.

User asked:
${userMessage}

Your response was:
${assistantMessage}

Please critically evaluate your response and identify:
1. Any factual errors or inaccuracies
2. Important information that was omitted
3. Areas where the response could be clearer or more helpful

Be honest and self-critical. Return structured output with issues found, your confidence level (0-1) in the original response, and optionally a suggestion for improvement.`
}
