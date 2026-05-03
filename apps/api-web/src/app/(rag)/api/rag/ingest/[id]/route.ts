import { ingestBodySchema, documentIdParamsSchema } from '@/features/rag/lib/validators'
import { ingestDocument } from '@/features/rag/mutations/ingest-document'
import { withAuth } from '@/lib/api/with-auth'
import { withErrorHandler } from '@/lib/api/with-error-handler'

export const POST = withErrorHandler(
  withAuth<{ id: string }>(async (req, { params }) => {
    const { id } = documentIdParamsSchema.parse(await params)
    const { content, mimeType } = ingestBodySchema.parse(await req.json())

    await ingestDocument({ documentId: id, content, mimeType })

    return new Response(null, { status: 204 })
  }),
)
