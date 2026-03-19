'use client'

import { SidebarTrigger, useSidebar } from '@workspace/ui/components/sidebar'
import dynamic from 'next/dynamic'
import type { ReactNode } from 'react'

const UserMenu = dynamic(() => import('./user-menu').then((m) => m.UserMenu), { ssr: false })

interface AppHeaderProps {
  children?: ReactNode
}

export function AppHeader({ children }: AppHeaderProps) {
  const { open, isMobile } = useSidebar()
  const contentLeft = open && !isMobile ? 'var(--sidebar-width)' : '0px'

  return (
    <header
      className="fixed top-0 right-0 z-9 flex h-14 items-center bg-background px-4 transition-[left] duration-200 ease-linear"
      style={{ left: contentLeft }}
    >
      <div className="flex flex-1 items-center">
        {(!open || isMobile) && <SidebarTrigger />}
      </div>
      {children}
      <div className="flex flex-1 items-center justify-end">
        <UserMenu />
      </div>
    </header>
  )
}
