import {
  SidebarInset,
  SidebarProvider,
} from '@workspace/ui/components/sidebar'
import { headers, cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { appPaths } from '@/config/app-paths'
import { AppSidebar } from '@/features/chat/components/app-sidebar'
import { auth } from '@/lib/auth'

import type { CSSProperties, ReactNode } from 'react'

export default async function ChatLayout({ children }: { children: ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session) {
    redirect(appPaths.auth.guest.getHref(appPaths.chat.index.href))
  }

  const cookieStore = await cookies()
  const sidebarDefaultOpen = cookieStore.get('sidebar_state')?.value === 'true'

  return (
    <SidebarProvider
      defaultOpen={sidebarDefaultOpen}
      style={{ '--sidebar-width': '20rem', '--sidebar-width-mobile': '20rem' } as CSSProperties}
    >
      <AppSidebar />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  )
}
