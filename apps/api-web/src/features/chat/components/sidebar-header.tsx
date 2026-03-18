'use client'

import { SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarTrigger } from '@workspace/ui/components/sidebar'
import Link from 'next/link'

import { Logo } from '@/components/logo'
import { appPaths } from '@/config/app-paths'

export function AppSidebarHeader() {
  return (
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem>
          <div className="flex items-center justify-between px-2 py-1 group-data-[collapsible=icon]:justify-center">
            <Link href={appPaths.home.href} className="flex items-center gap-2 group-data-[collapsible=icon]:hidden">
              <Logo />
              <span className="font-semibold text-sm">Lite Bot</span>
            </Link>
            <SidebarTrigger />
          </div>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
  )
}
