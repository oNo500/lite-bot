import { MAX_FILE_SIZE, SUPPORTED_MIME_TYPES } from '@/features/rag/lib/validators'
import { createDocument } from '@/features/rag/mutations/create-document'
import { ingestDocument } from '@/features/rag/mutations/ingest-document'
import { listDocuments } from '@/features/rag/queries/list-documents'
import { withAuth } from '@/lib/api/with-auth'
import { withErrorHandler } from '@/lib/api/with-error-handler'

const supportedMimeTypeSet = new Set<string>(SUPPORTED_MIME_TYPES)

export const GET = withErrorHandler(
  withAuth(async (_req, { auth }) => {
    const docs = await listDocuments(auth.session.user.id)
    return Response.json(docs)
  }),
)

export const POST = withErrorHandler(
  withAuth(async (req, { auth }) => {
    const formData = await req.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) {
      return Response.json({ error: 'Bad Request' }, { status: 400 })
    }

    if (!supportedMimeTypeSet.has(file.type)) {
      return Response.json({ error: 'Unsupported file type' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return Response.json({ error: 'File too large (max 10MB)' }, { status: 400 })
    }

    const doc = await createDocument({
      userId: auth.session.user.id,
      name: file.name,
      mimeType: file.type,
      size: file.size,
    })

    const content = await file.text()

    void ingestDocument({ documentId: doc.id, content, mimeType: file.type })

    return Response.json(doc, { status: 201 })
  }),
)
