'use client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from '@/components/ui/sonner'
import { useState, createContext, useContext, useEffect } from 'react'

const ThemeContext = createContext({ isDark: false, toggle: () => {} })
export function useCustomTheme() { return useContext(ThemeContext) }

function ThemeManager({ children }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    document.documentElement.classList.remove('dark')
    document.documentElement.style.colorScheme = 'light'
  }, [])

  if (!mounted) return null

  return (
    <ThemeContext.Provider value={{ isDark: false, toggle: () => {} }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function Providers({ children }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 30000, retry: 1 } }
  }))
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeManager>
        {children}
        <Toaster richColors position="top-right" />
      </ThemeManager>
    </QueryClientProvider>
  )
}
