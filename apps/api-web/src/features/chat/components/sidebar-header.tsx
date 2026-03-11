'use client'

import { SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarTrigger } from '@workspace/ui/components/sidebar'

import { Logo } from '@/components/logo'

export function AppSidebarHeader() {
  return (
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem>
          <div className="flex items-center justify-between px-2 py-1 group-data-[collapsible=icon]:justify-center">
            <div className="flex items-center gap-2 group-data-[collapsible=icon]:hidden">
              <Logo />
              <span className="font-semibold text-sm">Lite Bot</span>
            </div>
            <SidebarTrigger />
          </div>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
  )
}
