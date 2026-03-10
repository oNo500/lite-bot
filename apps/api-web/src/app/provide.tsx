import { Toaster } from '@workspace/ui/components/sonner'
import { ThemeProvider } from 'next-themes'

export const AppProvider = ({ children }: Readonly<{ children: React.ReactNode }>) => (
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    {children}
    <Toaster />
  </ThemeProvider>
)
