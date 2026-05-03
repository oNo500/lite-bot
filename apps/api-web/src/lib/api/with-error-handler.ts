import { ZodError } from 'zod'

import type { RouteHandler } from './types'

export function withErrorHandler<TParams = unknown>(
  handler: RouteHandler<TParams>,
): RouteHandler<TParams> {
  return async (req, ctx) => {
    try {
      return await handler(req, ctx)
    } catch (error) {
      if (error instanceof ZodError) {
        return Response.json(
          { error: 'ValidationError', issues: error.issues },
          { status: 400 },
        )
      }
      console.error('[route]', error)
      return Response.json({ error: 'InternalServerError' }, { status: 500 })
    }
  }
}
