import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

import { appPaths } from '@/config/app-paths'
import { auth } from '@/lib/auth'

import type { ReactNode } from 'react'

export default async function ChatLayout({ children }: { children: ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session) {
    redirect(appPaths.auth.guest.getHref(appPaths.chat.index.href))
  }

  return <>{children}</>
}
