'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@workspace/ui/components/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu'
import { HelpCircleIcon, LaptopIcon, LogOutIcon, MoonIcon, PaletteIcon, Settings2Icon, SunIcon } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useRouter } from 'next/navigation'

import { appPaths } from '@/config/app-paths'
import { authClient } from '@/lib/auth-client'

function getInitials(name: string, email?: string): string {
  if (name) {
    const parts = name.trim().split(' ')
    const first = parts[0]
    const last = parts.at(-1)
    if (parts.length >= 2 && first && last) {
      return `${first[0]}${last[0]}`.toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }
  if (email) {
    return email.split('@')[0]?.substring(0, 2).toUpperCase() ?? 'U'
  }
  return 'U'
}

export function UserMenu() {
  const router = useRouter()
  const { data: session } = authClient.useSession()
  const { setTheme } = useTheme()
  const user = session?.user

  const name = user?.name ?? ''
  const email = user?.email ?? ''
  const image = user?.image ?? ''

  async function handleLogout() {
    await authClient.signOut()
    router.push(appPaths.auth.login.getHref())
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <Avatar className="size-7">
          <AvatarImage src={image} alt={name} />
          <AvatarFallback className="text-xs">{getInitials(name, email)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium truncate">{name}</span>
              <span className="text-xs text-muted-foreground truncate">{email}</span>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <PaletteIcon />
              Theme
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => setTheme('light')}>
                  <SunIcon />
                  Light
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('dark')}>
                  <MoonIcon />
                  Dark
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('system')}>
                  <LaptopIcon />
                  System
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuItem>
            <Settings2Icon />
            Settings
          </DropdownMenuItem>
          <DropdownMenuItem>
            <HelpCircleIcon />
            Help
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={handleLogout}>
            <LogOutIcon />
            Logout
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
