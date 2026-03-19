'use client'

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@workspace/ui/components/sidebar'
import { BookOpenIcon } from 'lucide-react'
import Link from 'next/link'

import { appPaths } from '@/config/app-paths'

export function NavSecondary() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton render={<Link href={appPaths.rag.index.href} />} tooltip="知识库">
          <BookOpenIcon />
          <span>知识库</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
