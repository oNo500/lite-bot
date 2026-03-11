'use client'

import { Button } from '@workspace/ui/components/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@workspace/ui/components/dialog'
import { SidebarMenuButton, SidebarMenuItem } from '@workspace/ui/components/sidebar'
import { Trash2Icon } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { appPaths } from '@/config/app-paths'

import type { Chat } from '@/db/chat-queries'

interface ChatHistoryItemProps {
  chat: Chat
  onDelete: (chatId: string) => Promise<void>
}

export function ChatHistoryItem({ chat, onDelete }: ChatHistoryItemProps) {
  const pathname = usePathname()
  const router = useRouter()
  const isActive = pathname === appPaths.chat.detail.href(chat.id)

  async function handleConfirmDelete() {
    try {
      await onDelete(chat.id)
      if (isActive) {
        router.push(appPaths.home.href)
      }
    } catch {
      toast.error('Failed to delete chat')
    }
  }

  return (
    <SidebarMenuItem className="group/item relative">
      <SidebarMenuButton
        isActive={isActive}
        render={<Link href={appPaths.chat.detail.href(chat.id)} />}
        className="pr-8"
      >
        <span className="truncate">{chat.title}</span>
      </SidebarMenuButton>

      <Dialog>
        <DialogTrigger
          render={(
            <button
              type="button"
              className="absolute right-1 top-1/2 -translate-y-1/2 rounded p-1 opacity-0 transition-opacity hover:text-destructive group-hover/item:opacity-100"
              aria-label="Delete chat"
            />
          )}
        >
          <Trash2Icon className="size-3.5" />
        </DialogTrigger>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Delete conversation?</DialogTitle>
            <DialogDescription>
              &ldquo;
              {chat.title}
              &rdquo; will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarMenuItem>
  )
}
