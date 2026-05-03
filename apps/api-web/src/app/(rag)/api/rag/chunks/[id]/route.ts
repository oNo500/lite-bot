import { chunkIdParamsSchema, updateChunkSchema } from '@/features/rag/lib/validators'
import { updateChunk } from '@/features/rag/mutations/update-chunk'
import { withAuth } from '@/lib/api/with-auth'
import { withErrorHandler } from '@/lib/api/with-error-handler'

export const PATCH = withErrorHandler(
  withAuth<{ id: string }>(async (req, { params, auth }) => {
    const { id } = chunkIdParamsSchema.parse(await params)
    const patch = updateChunkSchema.parse(await req.json())

    const updated = await updateChunk({
      chunkId: id,
      userId: auth.session.user.id,
      patch,
    })

    if (!updated) {
      return Response.json({ error: 'Not Found' }, { status: 404 })
    }

    return Response.json(updated)
  }),
)
