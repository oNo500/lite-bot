import { headers } from 'next/headers'

import { auth } from '@/lib/auth'

import type { AuthedRouteHandler, RouteHandler } from './types'

export function withAuth<TParams = unknown>(
  handler: AuthedRouteHandler<TParams>,
): RouteHandler<TParams> {
  return async (req, { params }) => {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return handler(req, { params, auth: { session } })
  }
}
