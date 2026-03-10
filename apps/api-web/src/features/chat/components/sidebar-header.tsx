'use client'

import { Button } from '@workspace/ui/components/button'
import { SidebarHeader, SidebarMenu, SidebarMenuItem } from '@workspace/ui/components/sidebar'
import { PlusIcon } from 'lucide-react'
import Link from 'next/link'

import { Logo } from '@/components/logo'
import { appPaths } from '@/config/app-paths'

export function AppSidebarHeader() {
  return (
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem>
          <div className="flex items-center justify-between px-2 py-1">
            <div className="flex items-center gap-2">
              <Logo />
              <span className="font-semibold text-sm">Lite Bot</span>
            </div>
            <Button variant="ghost" size="icon" render={<Link href={appPaths.chat.index.href} aria-label="New chat" />}>
              <PlusIcon className="size-4" />
            </Button>
          </div>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
  )
}
