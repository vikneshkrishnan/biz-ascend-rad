'use client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from '@/components/ui/sonner'
import { useState, createContext, useContext, useEffect } from 'react'

const ThemeContext = createContext({ isDark: true, toggle: () => {} })
export function useCustomTheme() { return useContext(ThemeContext) }

function ThemeManager({ children }) {
  const [isDark, setIsDark] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem('rad-theme')
    const prefersDark = stored ? stored === 'dark' : true
    setIsDark(prefersDark)
    if (prefersDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  function toggle() {
    setIsDark(prev => {
      const newDark = !prev
      localStorage.setItem('rad-theme', newDark ? 'dark' : 'light')
      document.documentElement.classList.toggle('dark', newDark)
      document.documentElement.style.colorScheme = newDark ? 'dark' : 'light'
      return newDark
    })
  }

  if (!mounted) return null

  return (
    <ThemeContext.Provider value={{ isDark, toggle }}>
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
