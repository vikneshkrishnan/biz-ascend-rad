'use client'
import { useState } from 'react'
import { useAuth, useRouter, isDemoMode } from '@/components/shared/context'
import { useCustomTheme } from '@/app/providers'
import { 
  LayoutDashboard, FolderKanban, Users, LogOut, Sun, Moon, Zap,
  PanelLeftClose, PanelLeftOpen, Menu, X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export function AppShell({ children }) {
  const { profile, logout, navigate } = useAuth()
  const { hash } = useRouter()
  const { theme, setTheme } = useCustomTheme()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/', roles: ['admin', 'consultant'] },
    { icon: FolderKanban, label: 'Projects', href: '/projects', roles: ['admin', 'consultant'] },
    { icon: Users, label: 'Users', href: '/users', roles: ['admin'] },
  ].filter(item => item.roles.includes(profile?.role))

  const isActive = (href) => {
    if (href === '/') return hash === '/' || hash === ''
    return hash.startsWith(href)
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Mobile overlay */}
      {mobileOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />}
      
      {/* Sidebar */}
      <aside className={`fixed lg:sticky top-0 h-screen z-50 flex flex-col border-r bg-card transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'} ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        {/* Logo */}
        <div className={`h-16 flex items-center border-b px-4 ${collapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5 text-primary-foreground" />
          </div>
          {!collapsed && <span className="font-bold text-lg">RAD™</span>}
        </div>
        
        {/* Nav */}
        <nav className="flex-1 p-2 space-y-1">
          {navItems.map(item => (
            <button
              key={item.href}
              onClick={() => { navigate(item.href); setMobileOpen(false) }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${isActive(item.href) ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'} ${collapsed ? 'justify-center' : ''}`}
              data-testid={`nav-${item.label.toLowerCase()}`}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span className="font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>
        
        {/* Collapse toggle (desktop) */}
        <div className="hidden lg:block p-2 border-t">
          <Button variant="ghost" size="sm" className="w-full" onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <><PanelLeftClose className="w-4 h-4 mr-2" /><span>Collapse</span></>}
          </Button>
        </div>
        
        {/* User */}
        <div className={`p-3 border-t ${collapsed ? 'text-center' : ''}`}>
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold shrink-0">
              {profile?.full_name?.[0] || 'U'}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{profile?.full_name || 'User'}</p>
                <p className="text-xs text-muted-foreground capitalize">{profile?.role}</p>
              </div>
            )}
          </div>
        </div>
      </aside>
      
      {/* Main */}
      <main className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="h-16 border-b flex items-center justify-between px-4 lg:px-6 bg-card/50 backdrop-blur sticky top-0 z-30">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)}>
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2 ml-auto">
            <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} data-testid="theme-toggle">
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
            {isDemoMode() && <Badge variant="outline" className="border-primary text-primary">Demo</Badge>}
            <Badge variant="secondary" className="capitalize">{profile?.role}</Badge>
            <Button variant="ghost" size="sm" onClick={logout} data-testid="logout-btn">
              <LogOut className="w-4 h-4 mr-2" />Logout
            </Button>
          </div>
        </header>
        
        {/* Content */}
        <div className="flex-1 p-4 lg:p-6">{children}</div>
      </main>
    </div>
  )
}
