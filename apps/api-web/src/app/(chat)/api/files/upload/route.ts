import { put } from '@vercel/blob'
import { headers } from 'next/headers'

import { env } from '@/config/env'
import { auth } from '@/lib/auth'
import { ChatError } from '@/lib/errors'

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png'])
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return new ChatError('Unauthorized', 401).toResponse()

  const formData = await req.formData()
  const file = formData.get('file')

  if (!(file instanceof File)) {
    return new ChatError('Bad Request', 400).toResponse()
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return Response.json({ error: 'Only image/jpeg and image/png are allowed' }, { status: 415 })
  }

  if (file.size > MAX_SIZE) {
    return Response.json({ error: 'File exceeds 5MB limit' }, { status: 413 })
  }

  const blob = await put(`${session.user.id}/${file.name}`, file, {
    access: 'public',
    contentType: file.type,
    addRandomSuffix: true,
    token: env.BLOB_READ_WRITE_TOKEN,
  })

  return Response.json({ url: blob.url, contentType: blob.contentType })
}
