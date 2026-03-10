'use client'

import { ThemeSwitcher } from '@workspace/ui/components/kibo-ui/theme-switcher'
import { useTheme } from 'next-themes'

import { env } from '@/config/env'

export function Footer() {
  const { theme, setTheme } = useTheme()

  return (
    <footer className="border-t border-border">
      <div className="container py-6">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {'© '}
            {new Date().getFullYear()}
            {' '}
            {env.NEXT_PUBLIC_APP_NAME}
          </p>
          <ThemeSwitcher
            value={theme as 'light' | 'dark' | 'system'}
            onChange={setTheme}
          />
        </div>
      </div>
    </footer>
  )
}
