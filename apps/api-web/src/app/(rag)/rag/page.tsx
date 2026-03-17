import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

import { appPaths } from '@/config/app-paths'
import { RagPage } from '@/features/rag/rag-page'
import { auth } from '@/lib/auth'

export default async function Page() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect(appPaths.auth.guest.getHref(appPaths.rag.index.href))

  return <RagPage />
}
