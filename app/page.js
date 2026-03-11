'use client'
import { useState, useEffect, useCallback, createContext, useContext, useRef, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { useCustomTheme } from './providers'
import { toast } from 'sonner'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  LayoutDashboard, FolderKanban, Users, LogOut, Sun, Moon, Zap, Plus, Search,
  ChevronRight, ArrowLeft, Activity, CheckCircle2, Clock, AlertTriangle, Copy,
  PanelLeftClose, PanelLeftOpen, MoreVertical, Building2, FileText, Link2,
  TrendingUp, Shield, Trash2, Edit, BarChart3, Eye, ChevronLeft, Menu, X,
  Target, Award, Gauge, RefreshCw, ExternalLink, Save, Loader2, Download, FileSpreadsheet, Mail, Send, Settings, Building
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'
import { INDUSTRIES, SCREENER_SECTIONS, DIAGNOSTIC_PILLARS, MATURITY_BANDS, PILLAR_NAMES, FREE_EMAIL_DOMAINS, MONTHS } from '@/lib/constants'
import { DEMO_PROFILE, DEMO_USERS, DEMO_PROJECTS, DEMO_STATS, DEMO_ACTIVITY, demoApiFetch } from '@/lib/mockData'

// ===== DEMO MODE =====
let _demoMode = false
export function setDemoMode(v) { _demoMode = v }
export function isDemoMode() { return _demoMode }

// ===== API HELPER =====
async function apiFetch(path, options = {}) {
  if (_demoMode) {
    await new Promise(r => setTimeout(r, 200 + Math.random() * 300)) // simulate latency
    if (options.method === 'POST' || options.method === 'PUT' || options.method === 'PATCH' || options.method === 'DELETE') {
      return { success: true }
    }
    return demoApiFetch(path)
  }
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token
  const fetchOptions = { method: options.method || 'GET', headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) } }
  if (options.body) fetchOptions.body = JSON.stringify(options.body)
  const res = await fetch(`/api${path}`, fetchOptions)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Something went wrong')
  return data
}

// ===== AUTH CONTEXT =====
const AuthContext = createContext(null)
function useAuth() { return useContext(AuthContext) }

// ===== HASH ROUTER =====
function useRouter() {
  const [hash, setHash] = useState('')
  useEffect(() => {
    const update = () => setHash(window.location.hash.slice(1) || '/login')
    update()
    window.addEventListener('hashchange', update)
    return () => window.removeEventListener('hashchange', update)
  }, [])
  const navigate = useCallback((path) => { window.location.hash = path }, [])
  return { hash, navigate }
}

function matchRoute(hash) {
  if (hash === '/dashboard') return { page: 'dashboard' }
  if (hash === '/admin/users') return { page: 'admin-users' }
  if (hash === '/admin/organization') return { page: 'admin-organization' }
  if (hash === '/projects') return { page: 'projects' }
  if (hash === '/projects/new') return { page: 'create-project' }
  const pd = hash.match(/^\/projects\/([^/]+)$/)
  if (pd) return { page: 'project-detail', id: pd[1] }
  const scr = hash.match(/^\/projects\/([^/]+)\/screener$/)
  if (scr) return { page: 'screener', id: scr[1] }
  const diag = hash.match(/^\/projects\/([^/]+)\/diagnostic$/)
  if (diag) return { page: 'diagnostic', id: diag[1] }
  const scores = hash.match(/^\/projects\/([^/]+)\/scores$/)
  if (scores) return { page: 'scores', id: scores[1] }
  const assess = hash.match(/^\/assess\/([^/]+)$/)
  if (assess) return { page: 'public-assess', token: assess[1] }
  return { page: 'not-found' }
}

// ===== UTILITY COMPONENTS =====
const CARD_COLORS = [
  'bg-slate-800 dark:bg-card text-white dark:text-foreground border-slate-700 dark:border-primary/20',
  'bg-slate-800 dark:bg-card text-white dark:text-foreground border-slate-700 dark:border-primary/20',
  'bg-slate-800 dark:bg-card text-white dark:text-foreground border-slate-700 dark:border-primary/20',
  'bg-slate-800 dark:bg-card text-white dark:text-foreground border-slate-700 dark:border-primary/20',
  'bg-slate-800 dark:bg-card text-white dark:text-foreground border-slate-700 dark:border-primary/20',
  'bg-slate-800 dark:bg-card text-white dark:text-foreground border-slate-700 dark:border-primary/20',
]

function StatusBadge({ status }) {
  const styles = {
    draft: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
    completed: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
    archived: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400',
    not_started: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    active: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
    expired: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
  }
  const labels = { draft: 'Draft', in_progress: 'In Progress', completed: 'Completed', archived: 'Archived', not_started: 'Not Started', active: 'Active', expired: 'Expired' }
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.draft}`}>{labels[status] || status}</span>
}

function LoadingScreen() {
  return <div className="min-h-screen flex items-center justify-center bg-background"><div className="flex flex-col items-center gap-4"><div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center animate-pulse"><Zap className="w-6 h-6 text-primary-foreground" /></div><p className="text-muted-foreground">Loading...</p></div></div>
}

function PageSkeleton() {
  return <div className="space-y-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}</div>
}

// ===== LOGIN PAGE =====
function LoginPage({ onSuccess, onDemo }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showForgotPassword, setShowForgotPassword] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { error: authErr } = await supabase.auth.signInWithPassword({ email, password })
      if (authErr) throw authErr
      toast.success('Welcome back!')
      onSuccess()
    } catch (err) { setError(err.message || 'Invalid credentials') } finally { setLoading(false) }
  }

  if (showForgotPassword) {
    return <ForgotPasswordPage onBack={() => setShowForgotPassword(false)} />
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/25">
            <Zap className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Biz Ascend RAD&trade;</h1>
          <p className="text-muted-foreground">Revenue Acceleration Diagnostic Platform</p>
        </div>
        <Card className="border-2">
          <CardContent className="pt-6">
            <form onSubmit={handleLogin} className="space-y-4">
              {error && <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg border border-destructive/20">{error}</div>}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" required className="h-11" data-testid="login-email-input" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <button type="button" onClick={() => setShowForgotPassword(true)} className="text-xs text-primary hover:underline" data-testid="forgot-password-link">
                    Forgot password?
                  </button>
                </div>
                <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" required className="h-11" data-testid="login-password-input" />
              </div>
              <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={loading} data-testid="login-submit-btn">
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Signing in...</> : 'Sign In'}
              </Button>
              <div className="relative"><div className="absolute inset-0 flex items-center"><Separator /></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">or</span></div></div>
              <Button type="button" variant="outline" className="w-full h-11" onClick={onDemo} data-testid="explore-demo-btn">
                <Eye className="w-4 h-4 mr-2" />Explore Demo
              </Button>
            </form>
          </CardContent>
        </Card>
        <p className="text-center text-xs text-muted-foreground">Contact your administrator for account access</p>
      </div>
    </div>
  )
}

// ===== FORGOT PASSWORD PAGE =====
function ForgotPasswordPage({ onBack }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email) {
      toast.error('Please enter your email')
      return
    }
    setLoading(true)
    try {
      // In demo mode, just simulate the flow
      if (_demoMode) {
        await new Promise(r => setTimeout(r, 1500))
        setSent(true)
        toast.success('Reset link sent! Check your email.')
      } else {
        // Real Supabase password reset
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        })
        if (error) throw error
        setSent(true)
        toast.success('Reset link sent! Check your email.')
      }
    } catch (err) {
      toast.error(err.message || 'Failed to send reset link')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/25">
            <Zap className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Reset Password</h1>
          <p className="text-muted-foreground">
            {sent ? "Check your inbox for the reset link" : "Enter your email to receive a reset link"}
          </p>
        </div>
        <Card className="border-2">
          <CardContent className="pt-6 space-y-6">
            {sent ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-center">
                  <CheckCircle2 className="w-8 h-8 mx-auto text-green-500 mb-2" />
                  <p className="text-green-600 dark:text-green-400 font-medium">Reset link sent!</p>
                  <p className="text-sm text-muted-foreground mt-1">We've sent a password reset link to <strong>{email}</strong></p>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Didn't receive the email? Check your spam folder or try again.
                </p>
                <Button variant="outline" className="w-full" onClick={() => setSent(false)}>
                  Try another email
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email Address</Label>
                  <Input 
                    id="reset-email" 
                    type="email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    placeholder="you@company.com" 
                    className="h-11"
                    data-testid="forgot-email-input"
                  />
                </div>
                <Button type="submit" className="w-full h-11" disabled={loading} data-testid="forgot-submit-btn">
                  {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending...</> : 'Send Reset Link'}
                </Button>
              </form>
            )}
            <Button variant="ghost" className="w-full" onClick={onBack} data-testid="back-to-login-btn">
              <ArrowLeft className="w-4 h-4 mr-2" />Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ===== APP SHELL =====
function AppShell({ children }) {
  const { profile, navigate, hash } = useAuth()
  const { isDark, toggle: toggleTheme } = useCustomTheme()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const isAdmin = profile?.role === 'admin'

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Projects', icon: FolderKanban, path: '/projects' },
    ...(isAdmin ? [{ label: 'Users', icon: Users, path: '/admin/users' }] : []),
    ...(isAdmin ? [{ label: 'Organization', icon: Building, path: '/admin/organization' }] : []),
  ]

  async function handleLogout() {
    if (isDemoMode()) {
      setDemoMode(false)
      window.location.hash = '/login'
      window.location.reload()
      return
    }
    await supabase.auth.signOut()
    navigate('/login')
  }

  const NavContent = () => (
    <>
      <div className="p-4 flex items-center gap-3 border-b border-sidebar-border">
        <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shrink-0 shadow-sm">
          <Zap className="w-5 h-5 text-primary-foreground" />
        </div>
        {(sidebarOpen || mobileOpen) && <span className="font-bold text-lg bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">RAD&trade;</span>}
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(item => (
          <button key={item.path} onClick={() => { navigate(item.path); setMobileOpen(false) }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              hash?.startsWith(item.path) ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
            }`}>
            <item.icon className="w-5 h-5 shrink-0" />
            {(sidebarOpen || mobileOpen) && item.label}
          </button>
        ))}
      </nav>
      <div className="p-3 border-t border-sidebar-border">
        {(sidebarOpen || mobileOpen) && (
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
              {profile?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{profile?.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{profile?.role}</p>
            </div>
          </div>
        )}
      </div>
    </>
  )

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop sidebar */}
      <aside className={`hidden md:flex ${sidebarOpen ? 'w-64' : 'w-[68px]'} transition-all duration-300 border-r bg-sidebar flex-col shrink-0`}>
        <NavContent />
      </aside>
      {/* Mobile sidebar overlay */}
      {mobileOpen && <div className="fixed inset-0 z-50 md:hidden">
        <div className="fixed inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
        <aside className="fixed left-0 top-0 h-full w-64 bg-sidebar border-r z-50 flex flex-col"><NavContent /></aside>
      </div>}
      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="h-14 border-b bg-card/50 backdrop-blur-sm flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(true)}><Menu className="w-5 h-5" /></Button>
            <Button variant="ghost" size="icon" className="hidden md:flex" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-xl" data-testid="theme-toggle">
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            {isDemoMode() && <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">Demo</Badge>}
            <Badge variant="outline" className="capitalize hidden sm:flex">{profile?.role}</Badge>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-destructive">
              <LogOut className="w-4 h-4 sm:mr-2" /><span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </header>
        <main className="flex-1 overflow-auto">
          <div className="container py-6 max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  )
}

// ===== DASHBOARD =====
function DashboardPage() {
  const { profile, navigate } = useAuth()
  const { data: stats, isLoading } = useQuery({ queryKey: ['stats'], queryFn: () => apiFetch('/admin/stats') })
  const { data: activityData } = useQuery({ queryKey: ['activity'], queryFn: () => apiFetch('/activity?limit=5') })

  if (isLoading) return <PageSkeleton />
  const activity = activityData?.activities || []
  const cards = [
    { label: 'Total Projects', value: stats?.total_projects || 0, icon: FolderKanban, desc: 'All-time projects' },
    { label: 'Active Diagnostics', value: stats?.active_diagnostics || 0, icon: Activity, desc: 'In progress' },
    { label: 'Completed', value: stats?.completed_diagnostics || 0, icon: CheckCircle2, desc: 'Diagnostics done' },
    ...(profile?.role === 'admin' ? [{ label: 'Consultants', value: stats?.total_consultants || 0, icon: Users, desc: 'Active users' }] : []),
  ]

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back, {profile?.name}</p>
        </div>
        <Button onClick={() => navigate('/projects/new')} className="shadow-md"><Plus className="w-4 h-4 mr-2" />New Project</Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, i) => (
          <Card key={i} className={`border-2 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ${CARD_COLORS[i]}`}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{card.label}</p>
                  <p className="text-4xl font-bold mt-2 tracking-tight">{card.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{card.desc}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-primary/10"><card.icon className="w-5 h-5 text-primary" /></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-2">
          <CardHeader className="pb-3"><CardTitle className="text-lg flex items-center gap-2"><Activity className="w-5 h-5 text-primary" />Recent Activity</CardTitle></CardHeader>
          <CardContent>
            {activity.length === 0 ? (
              <div className="text-center py-12">
                <FolderKanban className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">No recent activity</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate('/projects/new')}>Create your first project</Button>
              </div>
            ) : (
              <div className="space-y-3">{activity.map((item, i) => (
                <div key={i} className="flex items-start gap-3 py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{item.action}</p>
                    <p className="text-xs text-muted-foreground">{new Date(item.created_at).toLocaleString()}</p>
                  </div>
                </div>
              ))}</div>
            )}
          </CardContent>
        </Card>
        {profile?.role === 'admin' && stats?.sectors && Object.keys(stats.sectors).length > 0 && (
          <Card className="border-2">
            <CardHeader className="pb-3"><CardTitle className="text-lg flex items-center gap-2"><BarChart3 className="w-5 h-5 text-primary" />Sector Distribution</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">{Object.entries(stats.sectors).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([sector, count], i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0"><p className="text-sm truncate">{sector}</p></div>
                  <div className="w-32 h-2 bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(count / Math.max(...Object.values(stats.sectors))) * 100}%` }} /></div>
                  <span className="text-sm font-medium w-6 text-right">{count}</span>
                </div>
              ))}</div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

// ===== PROJECTS LIST =====
function ProjectsListPage() {
  const { navigate, profile } = useAuth()
  const queryClient = useQueryClient()
  const { data: projects, isLoading } = useQuery({ queryKey: ['projects'], queryFn: () => apiFetch('/projects') })
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filtered = useMemo(() => {
    if (!projects) return []
    return projects.filter(p => {
      const matchSearch = p.company_name.toLowerCase().includes(search.toLowerCase()) || p.industry.toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === 'all' || p.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [projects, search, statusFilter])

  if (isLoading) return <PageSkeleton />

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div><h1 className="text-3xl font-bold tracking-tight">Projects</h1><p className="text-muted-foreground mt-1">{projects?.length || 0} total projects</p></div>
        <Button onClick={() => navigate('/projects/new')} className="shadow-md"><Plus className="w-4 h-4 mr-2" />New Project</Button>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Search projects..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" /></div>
        <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger><SelectContent>
          <SelectItem value="all">All Status</SelectItem><SelectItem value="draft">Draft</SelectItem><SelectItem value="in_progress">In Progress</SelectItem><SelectItem value="completed">Completed</SelectItem><SelectItem value="archived">Archived</SelectItem>
        </SelectContent></Select>
      </div>
      {filtered.length === 0 ? (
        <Card className="border-2 border-dashed"><CardContent className="py-16 text-center">
          <FolderKanban className="w-16 h-16 mx-auto text-muted-foreground/20 mb-4" />
          <h3 className="text-lg font-semibold">No projects found</h3>
          <p className="text-muted-foreground mt-1">{projects?.length === 0 ? 'Create your first project to get started' : 'Try adjusting your filters'}</p>
          {projects?.length === 0 && <Button className="mt-4" onClick={() => navigate('/projects/new')}><Plus className="w-4 h-4 mr-2" />Create Project</Button>}
        </CardContent></Card>
      ) : (
        <div className="grid gap-3">{filtered.map(project => (
          <Card key={project.id} className="border hover:border-primary/30 hover:shadow-md transition-all duration-200 cursor-pointer group" onClick={() => navigate(`/projects/${project.id}`)}>
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-4 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold truncate group-hover:text-primary transition-colors">{project.company_name}</h3>
                    <p className="text-sm text-muted-foreground">{project.industry}</p>
                    {profile?.role === 'admin' && project.consultant && <p className="text-xs text-muted-foreground mt-1">Consultant: {project.consultant.name}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3 sm:shrink-0">
                  <StatusBadge status={project.status} />
                  <span className="text-xs text-muted-foreground hidden sm:block">{new Date(project.created_at).toLocaleDateString()}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}</div>
      )}
    </div>
  )
}

// ===== CREATE PROJECT =====
function CreateProjectPage() {
  const { navigate, profile } = useAuth()
  const queryClient = useQueryClient()
  const [companyName, setCompanyName] = useState('')
  const [industry, setIndustry] = useState('')
  const [consultantId, setConsultantId] = useState('')
  const [saving, setSaving] = useState(false)
  const { data: consultants } = useQuery({ queryKey: ['users'], queryFn: () => apiFetch('/users'), enabled: profile?.role === 'admin' })

  async function handleSubmit(e) {
    e.preventDefault()
    if (!companyName || !industry) { toast.error('Please fill all required fields'); return }
    setSaving(true)
    try {
      const body = { company_name: companyName, industry }
      if (consultantId) body.consultant_id = consultantId
      const project = await apiFetch('/projects', { method: 'POST', body })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      toast.success('Project created!')
      navigate(`/projects/${project.id}`)
    } catch (err) { toast.error(err.message) } finally { setSaving(false) }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => navigate('/projects')} className="text-muted-foreground"><ArrowLeft className="w-4 h-4 mr-2" />Back to Projects</Button>
      <div><h1 className="text-3xl font-bold tracking-tight">New Project</h1><p className="text-muted-foreground mt-1">Create a new client diagnostic project</p></div>
      <Card className="border-2"><CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2"><Label htmlFor="companyName">Company Name *</Label><Input id="companyName" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="e.g., Acme Corporation" required className="h-11" /></div>
          <div className="space-y-2"><Label>Industry / Sector *</Label>
            <Select value={industry} onValueChange={setIndustry}><SelectTrigger className="h-11"><SelectValue placeholder="Select industry" /></SelectTrigger>
              <SelectContent><ScrollArea className="h-[300px]">{INDUSTRIES.map(ind => <SelectItem key={ind} value={ind}>{ind}</SelectItem>)}</ScrollArea></SelectContent>
            </Select>
          </div>
          {profile?.role === 'admin' && consultants && (
            <div className="space-y-2"><Label>Assign to Consultant</Label>
              <Select value={consultantId} onValueChange={setConsultantId}><SelectTrigger className="h-11"><SelectValue placeholder="Select consultant" /></SelectTrigger>
                <SelectContent>{consultants.filter(c => c.is_active).map(c => <SelectItem key={c.id} value={c.id}>{c.name} ({c.email})</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => navigate('/projects')} className="flex-1">Cancel</Button>
            <Button type="submit" disabled={saving} className="flex-1">{saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</> : 'Create Project'}</Button>
          </div>
        </form>
      </CardContent></Card>
    </div>
  )
}

// ===== PROJECT DETAIL =====
function ProjectDetailPage({ id }) {
  const { navigate, profile } = useAuth()
  const queryClient = useQueryClient()
  const { data: project, isLoading } = useQuery({ queryKey: ['project', id], queryFn: () => apiFetch(`/projects/${id}`) })
  const [showArchive, setShowArchive] = useState(false)
  const [linkLoading, setLinkLoading] = useState(false)

  if (isLoading) return <PageSkeleton />
  if (!project) return <div className="text-center py-20"><p className="text-muted-foreground">Project not found</p></div>

  const assessment = project.latest_assessment
  const screenerStatus = assessment?.screener_status || 'not_started'
  const diagnosticStatus = assessment?.diagnostic_status || 'not_started'
  const scores = assessment?.scores

  async function handleArchive() {
    try {
      await apiFetch(`/projects/${id}`, { method: 'PATCH', body: { status: 'archived' } })
      queryClient.invalidateQueries({ queryKey: ['project', id] })
      toast.success('Project archived')
      setShowArchive(false)
    } catch (err) { toast.error(err.message) }
  }

  async function generateLink() {
    setLinkLoading(true)
    try {
      const link = await apiFetch(`/projects/${id}/link`, { method: 'POST' })
      queryClient.invalidateQueries({ queryKey: ['project', id] })
      toast.success('Questionnaire link generated!')
    } catch (err) { toast.error(err.message) } finally { setLinkLoading(false) }
  }

  async function copyLink() {
    const url = project.questionnaire_link?.url || `${window.location.origin}#/assess/${project.questionnaire_link?.token}`
    await navigator.clipboard.writeText(url)
    toast.success('Link copied to clipboard!')
  }

  async function startReassessment() {
    try {
      await apiFetch(`/projects/${id}/reassess`, { method: 'POST' })
      queryClient.invalidateQueries({ queryKey: ['project', id] })
      toast.success('New assessment started')
    } catch (err) { toast.error(err.message) }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <button onClick={() => navigate('/projects')} className="hover:text-foreground transition-colors">Projects</button>
        <ChevronRight className="w-4 h-4" /><span className="text-foreground font-medium">{project.company_name}</span>
      </div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center"><Building2 className="w-7 h-7 text-primary" /></div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{project.company_name}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <Badge variant="secondary">{project.industry}</Badge>
              <StatusBadge status={project.status} />
              {project.consultant && <span className="text-sm text-muted-foreground">Consultant: {project.consultant.name}</span>}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {diagnosticStatus === 'completed' && <Button variant="outline" onClick={startReassessment}><RefreshCw className="w-4 h-4 mr-2" />Reassess</Button>}
          <Button variant="outline" className="text-destructive hover:text-destructive" onClick={() => setShowArchive(true)}><Trash2 className="w-4 h-4" /></Button>
        </div>
      </div>
      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className={`border-2 ${CARD_COLORS[0]}`}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3"><h3 className="font-semibold text-sm">Screener</h3><StatusBadge status={screenerStatus} /></div>
            <p className="text-xs text-muted-foreground mb-3">20 questions about company context</p>
            <Button size="sm" className="w-full" variant={screenerStatus === 'completed' ? 'outline' : 'default'} onClick={() => navigate(`/projects/${id}/screener`)}>
              {screenerStatus === 'not_started' ? 'Start Screener' : screenerStatus === 'in_progress' ? 'Continue Screener' : 'View Responses'}
            </Button>
          </CardContent>
        </Card>
        <Card className={`border-2 ${CARD_COLORS[1]}`}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3"><h3 className="font-semibold text-sm">Diagnostic</h3><StatusBadge status={diagnosticStatus} /></div>
            <p className="text-xs text-muted-foreground mb-3">7 pillars of growth readiness</p>
            <Button size="sm" className="w-full" variant={diagnosticStatus === 'completed' ? 'outline' : 'default'}
              disabled={screenerStatus !== 'completed'}
              onClick={() => navigate(`/projects/${id}/diagnostic`)}>
              {screenerStatus !== 'completed' ? 'Complete Screener First' : diagnosticStatus === 'not_started' ? 'Start Diagnostic' : diagnosticStatus === 'in_progress' ? 'Continue Diagnostic' : 'View Responses'}
            </Button>
          </CardContent>
        </Card>
        <Card className={`border-2 ${CARD_COLORS[2]}`}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3"><h3 className="font-semibold text-sm">Scores & Report</h3>{scores ? <StatusBadge status="completed" /> : <StatusBadge status="not_started" />}</div>
            <p className="text-xs text-muted-foreground mb-3">{scores ? `RAD Score: ${scores.radScore}` : 'Complete diagnostic to view'}</p>
            <Button size="sm" className="w-full" variant={scores ? 'default' : 'outline'} disabled={!scores} onClick={() => navigate(`/projects/${id}/scores`)}>
              {scores ? 'View Scores' : 'Not Available Yet'}
            </Button>
          </CardContent>
        </Card>
      </div>
      {/* Scores Summary */}
      {scores && (
        <Card className="border-2 bg-gradient-to-r from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/5">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-5xl font-bold text-primary">{scores.radScore}</p>
                  <p className="text-xs text-muted-foreground mt-1">RAD Score</p>
                </div>
                <Separator orientation="vertical" className="h-16 hidden sm:block" />
                <div>
                  <Badge className={`text-sm px-3 py-1 ${scores.maturityBand?.includes('Strong') ? 'bg-green-500' : scores.maturityBand?.includes('Developing') ? 'bg-amber-500' : scores.maturityBand?.includes('Fragile') ? 'bg-orange-500' : 'bg-red-500'} text-white`}>{scores.maturityBand}</Badge>
                  {scores.primaryConstraint && <p className="text-sm text-muted-foreground mt-2">Primary Constraint: <span className="text-destructive font-medium">{scores.primaryConstraint.name}</span></p>}
                </div>
              </div>
              <Button onClick={() => navigate(`/projects/${id}/scores`)}><TrendingUp className="w-4 h-4 mr-2" />View Full Report</Button>
            </div>
          </CardContent>
        </Card>
      )}
      {/* Questionnaire Link */}
      <Card className="border-2">
        <CardHeader className="pb-3"><CardTitle className="text-lg flex items-center gap-2"><Link2 className="w-5 h-5 text-primary" />Questionnaire Link</CardTitle><CardDescription>Share with client for self-service assessment</CardDescription></CardHeader>
        <CardContent>
          {project.questionnaire_link && project.questionnaire_link.status === 'active' ? (
            <div className="flex flex-col sm:flex-row gap-3">
              <Input readOnly value={project.questionnaire_link.url || `${window.location.origin}#/assess/${project.questionnaire_link.token}`} className="flex-1 font-mono text-sm" />
              <div className="flex gap-2">
                <Button variant="outline" onClick={copyLink}><Copy className="w-4 h-4 mr-2" />Copy</Button>
                <Button variant="outline" onClick={generateLink} disabled={linkLoading}><RefreshCw className="w-4 h-4 mr-2" />Regenerate</Button>
              </div>
            </div>
          ) : (
            <Button onClick={generateLink} disabled={linkLoading}>{linkLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating...</> : <><Link2 className="w-4 h-4 mr-2" />Generate Link</>}</Button>
          )}
        </CardContent>
      </Card>
      {/* Reassessment History */}
      {project.assessments?.length > 1 && (
        <Card className="border-2">
          <CardHeader className="pb-3"><CardTitle className="text-lg">Assessment History</CardTitle></CardHeader>
          <CardContent>
            <Table><TableHeader><TableRow><TableHead>#</TableHead><TableHead>Date</TableHead><TableHead>RAD Score</TableHead><TableHead>Maturity</TableHead><TableHead>Constraint</TableHead></TableRow></TableHeader>
              <TableBody>{project.assessments.map(a => (
                <TableRow key={a.id}><TableCell className="font-medium">#{a.assessment_number}</TableCell>
                  <TableCell>{a.completed_at ? new Date(a.completed_at).toLocaleDateString() : '-'}</TableCell>
                  <TableCell className="font-bold">{a.scores?.radScore || '-'}</TableCell>
                  <TableCell>{a.scores?.maturityBand || '-'}</TableCell>
                  <TableCell>{a.scores?.primaryConstraint?.name || '-'}</TableCell>
                </TableRow>
              ))}</TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
      {/* Archive dialog */}
      <Dialog open={showArchive} onOpenChange={setShowArchive}><DialogContent>
        <DialogHeader><DialogTitle>Archive Project?</DialogTitle><DialogDescription>This will archive &quot;{project.company_name}&quot;. You can unarchive it later.</DialogDescription></DialogHeader>
        <DialogFooter><Button variant="outline" onClick={() => setShowArchive(false)}>Cancel</Button><Button variant="destructive" onClick={handleArchive}>Archive</Button></DialogFooter>
      </DialogContent></Dialog>
    </div>
  )
}

// ===== ADMIN USERS =====
function AdminUsersPage() {
  const queryClient = useQueryClient()
  const { data: users, isLoading } = useQuery({ queryKey: ['users'], queryFn: () => apiFetch('/users') })
  const [showCreate, setShowCreate] = useState(false)
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'consultant' })
  const [creating, setCreating] = useState(false)

  async function handleCreate(e) {
    e.preventDefault()
    if (!newUser.name || !newUser.email || !newUser.password) { toast.error('All fields are required'); return }
    setCreating(true)
    try {
      await apiFetch('/users', { method: 'POST', body: newUser })
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('User created!')
      setShowCreate(false)
      setNewUser({ name: '', email: '', password: '', role: 'consultant' })
    } catch (err) { toast.error(err.message) } finally { setCreating(false) }
  }

  async function toggleActive(userId, currentActive) {
    try {
      await apiFetch(`/users/${userId}`, { method: 'PATCH', body: { is_active: !currentActive } })
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success(currentActive ? 'User deactivated' : 'User activated')
    } catch (err) { toast.error(err.message) }
  }

  if (isLoading) return <PageSkeleton />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold tracking-tight">User Management</h1><p className="text-muted-foreground mt-1">{users?.length || 0} users</p></div>
        <Button onClick={() => setShowCreate(true)} className="shadow-md"><Plus className="w-4 h-4 mr-2" />Add User</Button>
      </div>
      <Card className="border-2"><CardContent className="p-0">
        <Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead><TableHead>Status</TableHead><TableHead>Created</TableHead><TableHead className="w-[80px]">Actions</TableHead></TableRow></TableHeader>
          <TableBody>{(users || []).map(user => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.name}</TableCell>
              <TableCell className="text-muted-foreground">{user.email}</TableCell>
              <TableCell><Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="capitalize">{user.role}</Badge></TableCell>
              <TableCell><StatusBadge status={user.is_active ? 'active' : 'expired'} /></TableCell>
              <TableCell className="text-muted-foreground text-sm">{new Date(user.created_at).toLocaleDateString()}</TableCell>
              <TableCell>
                <Button variant="ghost" size="sm" onClick={() => toggleActive(user.id, user.is_active)} className="text-xs">
                  {user.is_active ? 'Deactivate' : 'Activate'}
                </Button>
              </TableCell>
            </TableRow>
          ))}</TableBody>
        </Table>
      </CardContent></Card>
      {/* Create User Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}><DialogContent>
        <DialogHeader><DialogTitle>Create User</DialogTitle><DialogDescription>Add a new consultant or admin user</DialogDescription></DialogHeader>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-2"><Label>Name</Label><Input value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} required /></div>
          <div className="space-y-2"><Label>Email</Label><Input type="email" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} required /></div>
          <div className="space-y-2"><Label>Password</Label><Input type="password" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} required /></div>
          <div className="space-y-2"><Label>Role</Label>
            <Select value={newUser.role} onValueChange={v => setNewUser({ ...newUser, role: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="consultant">Consultant</SelectItem><SelectItem value="admin">Admin</SelectItem></SelectContent></Select>
          </div>
          <DialogFooter><Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button><Button type="submit" disabled={creating}>{creating ? 'Creating...' : 'Create User'}</Button></DialogFooter>
        </form>
      </DialogContent></Dialog>
    </div>
  )
}

// ===== ORGANIZATION SETTINGS PAGE =====
function OrganizationSettingsPage() {
  const { profile } = useAuth()
  const queryClient = useQueryClient()
  const { data: org, isLoading } = useQuery({ queryKey: ['organization'], queryFn: () => apiFetch('/organization') })
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState(null)

  useEffect(() => {
    if (org?.settings) setSettings(org.settings)
  }, [org])

  async function handleSave() {
    setSaving(true)
    try {
      await apiFetch('/organization/settings', { method: 'PATCH', body: { settings } })
      queryClient.invalidateQueries({ queryKey: ['organization'] })
      toast.success('Settings saved!')
    } catch (err) {
      toast.error(err.message || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (isLoading) return <PageSkeleton />
  if (!org) return <div className="text-center py-20"><p className="text-muted-foreground">Organization not found</p></div>

  const planColors = { enterprise: 'bg-purple-500', professional: 'bg-blue-500', starter: 'bg-green-500' }
  const planFeatures = {
    enterprise: ['Unlimited users', 'Unlimited projects', 'AI Reports', 'PDF Export', 'Email Reports', 'White-label branding', 'Priority support'],
    professional: ['Up to 10 users', 'Up to 100 projects', 'AI Reports', 'PDF Export', 'Email Reports', 'Custom branding'],
    starter: ['Up to 3 users', 'Up to 20 projects', 'AI Reports', 'PDF Export']
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Organization Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your organization's settings and branding</p>
      </div>

      {/* Organization Info */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Building className="w-5 h-5 text-primary" />Organization Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground text-sm">Organization Name</Label>
              <p className="font-semibold text-lg">{org.name}</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-sm">Slug</Label>
              <p className="font-mono text-sm">{org.slug}</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-sm">Created</Label>
              <p className="text-sm">{new Date(org.created_at).toLocaleDateString()}</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-sm">Organization ID</Label>
              <p className="font-mono text-xs text-muted-foreground">{org.id}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plan & Usage */}
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2"><Zap className="w-5 h-5 text-primary" />Plan & Usage</CardTitle>
            <Badge className={`${planColors[org.plan]} text-white capitalize`}>{org.plan}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-muted/50 text-center">
              <p className="text-3xl font-bold text-primary">{DEMO_USERS?.length || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">Users</p>
              <p className="text-xs text-muted-foreground">of {org.max_users}</p>
            </div>
            <div className="p-4 rounded-xl bg-muted/50 text-center">
              <p className="text-3xl font-bold text-primary">{DEMO_PROJECTS?.length || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">Projects</p>
              <p className="text-xs text-muted-foreground">of {org.max_projects}</p>
            </div>
            <div className="p-4 rounded-xl bg-muted/50 text-center col-span-2">
              <p className="text-sm font-medium mb-2">Features Included</p>
              <div className="flex flex-wrap gap-1 justify-center">
                {(planFeatures[org.plan] || []).map((f, i) => (
                  <Badge key={i} variant="outline" className="text-xs">{f}</Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Branding Settings */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Settings className="w-5 h-5 text-primary" />Branding & Customization</CardTitle>
          <CardDescription>Customize the look and feel of your reports and client-facing pages</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {settings && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Primary Color</Label>
                  <div className="flex items-center gap-3">
                    <Input 
                      type="color" 
                      value={settings.branding?.primary_color || '#f97316'} 
                      onChange={e => setSettings({...settings, branding: {...settings.branding, primary_color: e.target.value}})}
                      className="w-16 h-10 p-1 cursor-pointer"
                    />
                    <Input 
                      value={settings.branding?.primary_color || '#f97316'} 
                      onChange={e => setSettings({...settings, branding: {...settings.branding, primary_color: e.target.value}})}
                      className="font-mono"
                      placeholder="#f97316"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Logo URL (optional)</Label>
                  <Input 
                    value={settings.branding?.logo_url || ''} 
                    onChange={e => setSettings({...settings, branding: {...settings.branding, logo_url: e.target.value}})}
                    placeholder="https://example.com/logo.png"
                  />
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email Sender Name</Label>
                  <Input 
                    value={settings.email?.sender_name || ''} 
                    onChange={e => setSettings({...settings, email: {...settings.email, sender_name: e.target.value}})}
                    placeholder="Your Company RAD"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Reply-To Email</Label>
                  <Input 
                    type="email"
                    value={settings.email?.reply_to || ''} 
                    onChange={e => setSettings({...settings, email: {...settings.email, reply_to: e.target.value}})}
                    placeholder="support@yourcompany.com"
                  />
                </div>
              </div>
            </>
          )}
          <div className="flex justify-end pt-4">
            <Button onClick={handleSave} disabled={saving} data-testid="save-org-settings-btn">
              {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : <><Save className="w-4 h-4 mr-2" />Save Settings</>}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Multi-tenant Info */}
      <Card className="border-2 border-dashed">
        <CardContent className="p-6 text-center">
          <Building2 className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
          <h3 className="font-semibold mb-2">Multi-Tenant Architecture</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            All data is isolated to your organization. Users and projects are scoped to <strong>{org.name}</strong> and cannot be accessed by other organizations.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

// ===== SCREENER PAGE =====
function ScreenerPage({ id }) {
  const { navigate } = useAuth()
  const [responses, setResponses] = useState({})
  const [currentSection, setCurrentSection] = useState(0)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const saveTimeout = useRef(null)

  useEffect(() => {
    apiFetch(`/projects/${id}/screener`).then(data => { setResponses(data.responses || {}); setLoaded(true) }).catch(() => setLoaded(true))
  }, [id])

  function updateResponse(qId, value) {
    const newResponses = { ...responses, [qId]: value }
    setResponses(newResponses)
    if (saveTimeout.current) clearTimeout(saveTimeout.current)
    saveTimeout.current = setTimeout(async () => {
      setSaving(true)
      try { await apiFetch(`/projects/${id}/screener`, { method: 'PUT', body: { responses: newResponses } }); setSaved(true); setTimeout(() => setSaved(false), 2000) }
      catch (e) { toast.error('Failed to save') } finally { setSaving(false) }
    }, 800)
  }

  async function handleSubmit() {
    await apiFetch(`/projects/${id}/screener`, { method: 'PUT', body: { responses } })
    await apiFetch(`/projects/${id}/screener/submit`, { method: 'POST' })
    toast.success('Screener completed!')
    navigate(`/projects/${id}`)
  }

  if (!loaded) return <PageSkeleton />
  const section = SCREENER_SECTIONS[currentSection]
  const progress = ((currentSection + 1) / SCREENER_SECTIONS.length) * 100

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate(`/projects/${id}`)}><ArrowLeft className="w-4 h-4 mr-2" />Back to Project</Button>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">{saving ? <><Loader2 className="w-3 h-3 animate-spin" />Saving...</> : saved ? <><CheckCircle2 className="w-3 h-3 text-green-500" />Saved</> : null}</div>
      </div>
      <div><h1 className="text-2xl font-bold">Screener Questionnaire</h1><p className="text-muted-foreground mt-1">Section {currentSection + 1} of {SCREENER_SECTIONS.length}: {section.title}</p></div>
      <Progress value={progress} className="h-2" />
      <Card className="border-2"><CardContent className="p-6 space-y-6">
        {section.questions.map(q => (
          <div key={q.id} className="space-y-2">
            <Label className="text-base font-medium">{q.label} {q.required && <span className="text-destructive">*</span>}</Label>
            {q.type === 'text' && <Input value={responses[q.id] || ''} onChange={e => updateResponse(q.id, e.target.value)} />}
            {q.type === 'email' && <Input type="email" value={responses[q.id] || ''} onChange={e => updateResponse(q.id, e.target.value)} />}
            {q.type === 'textarea' && <Textarea value={responses[q.id] || ''} onChange={e => updateResponse(q.id, e.target.value)} placeholder={q.placeholder || ''} rows={3} />}
            {q.type === 'radio' && (
              <RadioGroup value={responses[q.id] || ''} onValueChange={v => updateResponse(q.id, v)}>
                {q.options.map(opt => <div key={opt} className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50 transition-colors"><RadioGroupItem value={opt} id={`${q.id}-${opt}`} /><Label htmlFor={`${q.id}-${opt}`} className="flex-1 cursor-pointer text-sm">{opt}</Label></div>)}
              </RadioGroup>
            )}
            {q.type === 'select' && (
              <Select value={responses[q.id] || ''} onValueChange={v => updateResponse(q.id, v)}><SelectTrigger><SelectValue placeholder={`Select ${q.label.toLowerCase()}`} /></SelectTrigger>
                <SelectContent><ScrollArea className="h-[250px]">{(q.options === 'INDUSTRIES' ? INDUSTRIES : q.options === 'MONTHS' ? MONTHS : (q.options || [])).map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</ScrollArea></SelectContent>
              </Select>
            )}
            {q.type === 'checkbox' && (
              <div className="space-y-2">{q.options.map(opt => (
                <div key={opt} className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                  <Checkbox id={`${q.id}-${opt}`} checked={(responses[q.id] || []).includes(opt)} onCheckedChange={checked => {
                    const current = responses[q.id] || []
                    updateResponse(q.id, checked ? [...current, opt] : current.filter(v => v !== opt))
                  }} /><Label htmlFor={`${q.id}-${opt}`} className="flex-1 cursor-pointer text-sm">{opt}</Label>
                </div>
              ))}</div>
            )}
            {q.type === 'multiselect' && (
              <Input value={responses[q.id] || ''} onChange={e => updateResponse(q.id, e.target.value)} placeholder="Enter countries separated by commas" />
            )}
            {q.type === 'currency' && (
              <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input type="text" value={responses[q.id] || ''} onChange={e => updateResponse(q.id, e.target.value.replace(/[^\d.,]/g, ''))} placeholder={q.placeholder} className="pl-7" />
              </div>
            )}
            {q.note && <p className="text-xs text-muted-foreground italic">{q.note}</p>}
          </div>
        ))}
      </CardContent></Card>
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setCurrentSection(Math.max(0, currentSection - 1))} disabled={currentSection === 0}><ChevronLeft className="w-4 h-4 mr-1" />Back</Button>
        {currentSection < SCREENER_SECTIONS.length - 1 ? (
          <Button onClick={() => setCurrentSection(currentSection + 1)}>Next<ChevronRight className="w-4 h-4 ml-1" /></Button>
        ) : (
          <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700"><CheckCircle2 className="w-4 h-4 mr-2" />Complete Screener</Button>
        )}
      </div>
    </div>
  )
}

// ===== DIAGNOSTIC PAGE =====
function DiagnosticPage({ id }) {
  const { navigate } = useAuth()
  const [responses, setResponses] = useState({})
  const [screenerResponses, setScreenerResponses] = useState({})
  const [currentPillar, setCurrentPillar] = useState(0)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [status, setStatus] = useState('not_started')
  const saveTimeout = useRef(null)

  useEffect(() => {
    apiFetch(`/projects/${id}/diagnostic`).then(data => {
      setResponses(data.responses || {})
      setScreenerResponses(data.screener_responses || {})
      setStatus(data.status)
      setLoaded(true)
    }).catch(() => setLoaded(true))
  }, [id])

  const salesModel = screenerResponses.q10 || 'Direct Sales'

  function updateResponse(qId, value) {
    const newResponses = { ...responses, [qId]: value }
    setResponses(newResponses)
    if (saveTimeout.current) clearTimeout(saveTimeout.current)
    saveTimeout.current = setTimeout(async () => {
      setSaving(true)
      try { await apiFetch(`/projects/${id}/diagnostic`, { method: 'PUT', body: { responses: newResponses } }); setSaved(true); setTimeout(() => setSaved(false), 2000) }
      catch (e) { toast.error('Failed to save') } finally { setSaving(false) }
    }, 800)
  }

  async function handleSubmit() {
    await apiFetch(`/projects/${id}/diagnostic`, { method: 'PUT', body: { responses } })
    const result = await apiFetch(`/projects/${id}/diagnostic/submit`, { method: 'POST' })
    toast.success('Diagnostic completed!')
    navigate(`/projects/${id}/scores`)
  }

  if (!loaded) return <PageSkeleton />
  const pillar = DIAGNOSTIC_PILLARS[currentPillar]
  const progress = ((currentPillar + 1) / DIAGNOSTIC_PILLARS.length) * 100
  const isReadOnly = status === 'completed'

  function getQuestionData(q) {
    if (q.type === 'conditional') {
      const key = salesModel === 'Partner-Channel Sales' ? 'Partner-Channel Sales' : salesModel
      const variant = q.variants[key] || q.variants['Direct Sales']
      return { text: variant.text, options: variant.options, type: 'scored' }
    }
    return q
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate(`/projects/${id}`)}><ArrowLeft className="w-4 h-4 mr-2" />Back to Project</Button>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">{saving ? <><Loader2 className="w-3 h-3 animate-spin" />Saving...</> : saved ? <><CheckCircle2 className="w-3 h-3 text-green-500" />Saved</> : null}</div>
      </div>
      <div>
        <h1 className="text-2xl font-bold">Diagnostic Assessment</h1>
        <p className="text-muted-foreground mt-1">Pillar {currentPillar + 1} of {DIAGNOSTIC_PILLARS.length}: {pillar.name} — Weight: {Math.round(pillar.weight * 100)}%</p>
      </div>
      <Progress value={progress} className="h-2" />
      <div className="flex gap-1 overflow-x-auto pb-2">{DIAGNOSTIC_PILLARS.map((p, i) => (
        <button key={p.id} onClick={() => setCurrentPillar(i)} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${i === currentPillar ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
          P{i + 1}
        </button>
      ))}</div>
      <Card className="border-2"><CardContent className="p-6 space-y-8">
        {pillar.questions.map((rawQ, qi) => {
          const q = getQuestionData(rawQ)
          return (
            <div key={rawQ.id} className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">{qi + 1}</span>
                <div className="flex-1">
                  <p className="font-medium leading-relaxed">{q.text}</p>
                  {q.type === 'qualitative' && <Badge variant="outline" className="mt-1 text-xs">Strategic Question</Badge>}
                </div>
              </div>
              {q.type === 'scored' && q.options && (
                <div className="space-y-2 ml-10">{q.options.map((opt, oi) => (
                  <button key={oi} disabled={isReadOnly}
                    onClick={() => updateResponse(rawQ.id, opt.s)}
                    className={`w-full text-left p-3 rounded-xl border-2 transition-all duration-200 text-sm ${
                      responses[rawQ.id] === opt.s ? 'border-primary bg-primary/5 dark:bg-primary/10 shadow-sm' : 'border-border hover:border-primary/30 hover:bg-muted/50'
                    } ${isReadOnly ? 'cursor-default' : 'cursor-pointer'}`}>
                    <span className={responses[rawQ.id] === opt.s ? 'font-medium text-primary' : ''}>{opt.l}</span>
                  </button>
                ))}</div>
              )}
              {q.type === 'qualitative' && (
                <div className="ml-10"><Textarea value={responses[rawQ.id] || ''} onChange={e => updateResponse(rawQ.id, e.target.value)} rows={4} placeholder="Share your thoughts..." disabled={isReadOnly} className="resize-none" /></div>
              )}
            </div>
          )
        })}
      </CardContent></Card>
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setCurrentPillar(Math.max(0, currentPillar - 1))} disabled={currentPillar === 0}><ChevronLeft className="w-4 h-4 mr-1" />Previous Pillar</Button>
        {currentPillar < DIAGNOSTIC_PILLARS.length - 1 ? (
          <Button onClick={() => setCurrentPillar(currentPillar + 1)}>Next Pillar<ChevronRight className="w-4 h-4 ml-1" /></Button>
        ) : !isReadOnly ? (
          <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700"><CheckCircle2 className="w-4 h-4 mr-2" />Submit Diagnostic</Button>
        ) : null}
      </div>
    </div>
  )
}

// ===== SCORES PAGE =====
function ScoresPage({ id }) {
  const { navigate, profile } = useAuth()
  const queryClient = useQueryClient()
  const { data: scores, isLoading } = useQuery({ queryKey: ['scores', id], queryFn: () => apiFetch(`/projects/${id}/scores`) })
  const { data: project } = useQuery({ queryKey: ['project', id], queryFn: () => apiFetch(`/projects/${id}`) })
  const [generating, setGenerating] = useState(false)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [report, setReport] = useState(null)
  const [showSendDialog, setShowSendDialog] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [emailForm, setEmailForm] = useState({ email: '', message: '' })

  async function generateReport() {
    setGenerating(true)
    try {
      const result = await apiFetch(`/projects/${id}/report/generate`, { method: 'POST' })
      setReport(result)
      setShowReport(true)
      toast.success('Report generated successfully!')
      queryClient.invalidateQueries({ queryKey: ['report', id] })
    } catch (err) {
      toast.error(err.message || 'Failed to generate report')
    } finally {
      setGenerating(false)
    }
  }

  async function loadReport() {
    try {
      const result = await apiFetch(`/projects/${id}/report`)
      setReport(result)
      setShowReport(true)
    } catch (err) {
      toast.info('No report found. Click "Generate Report" to create one.')
    }
  }

  async function downloadPdf() {
    setDownloadingPdf(true)
    try {
      const result = await apiFetch(`/projects/${id}/report/pdf`)
      // Decode base64 and download
      const byteCharacters = atob(result.pdf)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = result.filename || 'RAD_Report.pdf'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('PDF downloaded!')
    } catch (err) {
      toast.error(err.message || 'Failed to download PDF. Generate report first.')
    } finally {
      setDownloadingPdf(false)
    }
  }

  function exportToCSV() {
    if (!scores || !project) {
      toast.error('No data to export')
      return
    }

    const companyName = project.company_name || 'Company'
    const rows = []
    
    // Header row
    rows.push(['Biz Ascend RAD - Diagnostic Export'])
    rows.push(['Company', companyName])
    rows.push(['Industry', project.industry || ''])
    rows.push(['Export Date', new Date().toLocaleDateString()])
    rows.push([])
    
    // Overall scores
    rows.push(['=== OVERALL SCORES ==='])
    rows.push(['RAD Score', scores.radScore])
    rows.push(['Maturity Band', scores.maturityBand])
    rows.push(['Primary Constraint', scores.primaryConstraint?.name || ''])
    rows.push([])
    
    // Pillar scores
    rows.push(['=== PILLAR SCORES ==='])
    rows.push(['Pillar', 'Score', 'Average', 'Status'])
    Object.entries(scores.pillarScores || {}).forEach(([pid, data]) => {
      const status = data.avg >= 4 ? 'Strong' : data.avg >= 3 ? 'Developing' : 'At Risk'
      rows.push([PILLAR_NAMES[pid] || pid, data.score, data.avg?.toFixed(2), status])
    })
    rows.push([])
    
    // RAPS
    if (scores.raps) {
      rows.push(['=== REVENUE ACHIEVEMENT PROBABILITY (RAPS) ==='])
      rows.push(['RAPS Score', `${scores.raps.score}%`])
      rows.push(['Revenue Target', `$${(scores.raps.revenueTarget || 0).toLocaleString()}`])
      rows.push(['Already Invoiced', `$${(scores.raps.revenueInvoiced || 0).toLocaleString()}`])
      rows.push(['Remaining', `$${(scores.raps.revenueRemaining || 0).toLocaleString()}`])
      rows.push(['Months Left', scores.raps.monthsRemaining])
      rows.push([])
    }
    
    // Assessment history
    if (project.assessments?.length > 1) {
      rows.push(['=== ASSESSMENT HISTORY ==='])
      rows.push(['Assessment #', 'RAD Score', 'RAPS %', 'Maturity Band', 'Completed'])
      project.assessments.filter(a => a.scores).forEach(a => {
        rows.push([
          a.assessment_number,
          a.scores?.radScore || '',
          a.scores?.raps?.score ? `${a.scores.raps.score}%` : '',
          a.scores?.maturityBand || '',
          a.completed_at ? new Date(a.completed_at).toLocaleDateString() : ''
        ])
      })
    }
    
    // Convert to CSV string
    const csvContent = rows.map(row => row.map(cell => {
      const str = String(cell ?? '')
      return str.includes(',') || str.includes('"') || str.includes('\n') 
        ? `"${str.replace(/"/g, '""')}"` 
        : str
    }).join(',')).join('\n')
    
    // Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${companyName.replace(/\s+/g, '_')}_RAD_Scores.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('CSV exported!')
  }

  async function sendToClient(e) {
    e.preventDefault()
    if (!emailForm.email) {
      toast.error('Please enter a recipient email')
      return
    }
    setSendingEmail(true)
    try {
      // In demo mode, simulate sending
      if (_demoMode) {
        await new Promise(r => setTimeout(r, 2000))
        toast.success(`Report sent to ${emailForm.email}!`)
        setShowSendDialog(false)
        setEmailForm({ email: '', message: '' })
      } else {
        await apiFetch('/notifications/send-pdf-report', {
          method: 'POST',
          body: { project_id: id, recipient_email: emailForm.email, message: emailForm.message }
        })
        toast.success(`Report sent to ${emailForm.email}!`)
        setShowSendDialog(false)
        setEmailForm({ email: '', message: '' })
      }
    } catch (err) {
      toast.error(err.message || 'Failed to send email')
    } finally {
      setSendingEmail(false)
    }
  }

  if (isLoading) return <PageSkeleton />
  if (!scores) return <div className="text-center py-20"><p className="text-muted-foreground">No scores available</p></div>

  const bandColor = scores.maturityBand?.includes('Strong') ? 'green' : scores.maturityBand?.includes('Developing') ? 'amber' : scores.maturityBand?.includes('Fragile') ? 'orange' : 'red'
  const bandColorClass = { green: 'bg-green-500', amber: 'bg-amber-500', orange: 'bg-orange-500', red: 'bg-red-500' }
  const trafficLight = (avg) => avg >= 4 ? 'bg-green-500' : avg >= 3 ? 'bg-amber-500' : 'bg-red-500'
  
  // Prepare chart data for pillar radar
  const radarData = Object.entries(scores.pillarScores || {}).map(([pid, data]) => ({
    pillar: PILLAR_NAMES[pid]?.split(' ')[0] || pid,
    fullName: PILLAR_NAMES[pid],
    score: data.score,
    fullMark: 100
  }))

  // Prepare trend data if multiple assessments exist
  const assessments = project?.assessments || []
  const trendData = assessments.filter(a => a.scores).map(a => ({
    name: `#${a.assessment_number}`,
    radScore: a.scores?.radScore || 0,
    raps: a.scores?.raps?.score || 0,
    date: a.completed_at ? new Date(a.completed_at).toLocaleDateString() : ''
  })).reverse()

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Button variant="ghost" onClick={() => navigate(`/projects/${id}`)}><ArrowLeft className="w-4 h-4 mr-2" />Back to Project</Button>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={exportToCSV} data-testid="export-csv-btn">
            <FileSpreadsheet className="w-4 h-4 mr-2" />Export CSV
          </Button>
          <Button variant="outline" onClick={() => setShowSendDialog(true)} data-testid="send-to-client-btn">
            <Mail className="w-4 h-4 mr-2" />Send to Client
          </Button>
          <Button variant="outline" onClick={loadReport} data-testid="view-report-btn">
            <FileText className="w-4 h-4 mr-2" />View Report
          </Button>
          <Button variant="outline" onClick={downloadPdf} disabled={downloadingPdf} data-testid="download-pdf-btn">
            {downloadingPdf ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Downloading...</> : <><Download className="w-4 h-4 mr-2" />Download PDF</>}
          </Button>
          <Button onClick={generateReport} disabled={generating} data-testid="generate-report-btn">
            {generating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating...</> : <><Zap className="w-4 h-4 mr-2" />Generate AI Report</>}
          </Button>
        </div>
      </div>
      
      {/* Overall Score */}
      <Card className="border-2 overflow-hidden">
        <div className={`h-2 ${bandColorClass[bandColor]}`} />
        <CardContent className="p-8 text-center">
          <p className="text-sm text-muted-foreground mb-2">RAD Growth System Score</p>
          <p className="text-7xl font-bold text-primary tracking-tighter">{scores.radScore}</p>
          <Badge className={`mt-4 text-base px-4 py-1.5 ${bandColorClass[bandColor]} text-white`}>{scores.maturityBand}</Badge>
          {scores.primaryConstraint && (
            <div className="mt-6 p-4 rounded-xl bg-destructive/5 border border-destructive/20 inline-block">
              <p className="text-sm text-muted-foreground">Primary Growth Constraint</p>
              <p className="text-lg font-bold text-destructive mt-1">{scores.primaryConstraint.name}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pillar Radar Chart */}
        <Card className="border-2">
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><BarChart3 className="w-5 h-5 text-primary" />Pillar Performance</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="pillar" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                  <Radar name="Score" dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} strokeWidth={2} />
                  <Tooltip content={({ payload }) => payload?.[0] ? (
                    <div className="bg-popover border rounded-lg p-2 shadow-lg">
                      <p className="font-medium text-sm">{payload[0].payload.fullName}</p>
                      <p className="text-primary font-bold">{payload[0].value}/100</p>
                    </div>
                  ) : null} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Score Trend Chart */}
        {trendData.length > 1 ? (
          <Card className="border-2">
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><TrendingUp className="w-5 h-5 text-primary" />Score Trend</CardTitle></CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                    <YAxis domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                    <Tooltip content={({ payload, label }) => payload?.length ? (
                      <div className="bg-popover border rounded-lg p-3 shadow-lg">
                        <p className="font-medium mb-2">Assessment {label}</p>
                        {payload.map((p, i) => (
                          <p key={i} style={{ color: p.color }} className="text-sm">{p.name}: <span className="font-bold">{p.value}</span></p>
                        ))}
                      </div>
                    ) : null} />
                    <Legend />
                    <Line type="monotone" dataKey="radScore" name="RAD Score" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 6 }} activeDot={{ r: 8 }} />
                    <Line type="monotone" dataKey="raps" name="RAPS %" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-2">
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><TrendingUp className="w-5 h-5 text-primary" />Pillar Scores</CardTitle></CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={radarData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                    <YAxis type="category" dataKey="pillar" width={80} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                    <Tooltip content={({ payload }) => payload?.[0] ? (
                      <div className="bg-popover border rounded-lg p-2 shadow-lg">
                        <p className="font-medium text-sm">{payload[0].payload.fullName}</p>
                        <p className="text-primary font-bold">{payload[0].value}/100</p>
                      </div>
                    ) : null} />
                    <Bar dataKey="score" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Pillar Details */}
      <Card className="border-2">
        <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="w-5 h-5 text-primary" />Diagnostic Overview</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">{Object.entries(scores.pillarScores || {}).map(([pid, data], i) => {
            const isPrimary = scores.primaryConstraint?.id === pid
            return (
              <div key={pid} className={`p-4 rounded-xl border-2 transition-all ${isPrimary ? 'border-destructive/40 bg-destructive/5' : 'border-border'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${trafficLight(data.avg)}`} />
                    <span className={`font-medium ${isPrimary ? 'text-destructive' : ''}`}>{PILLAR_NAMES[pid]}</span>
                    {isPrimary && <Badge variant="destructive" className="text-xs">Primary Constraint</Badge>}
                  </div>
                  <span className="font-bold text-lg">{data.score}</span>
                </div>
                <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${trafficLight(data.avg)}`} style={{ width: `${data.score}%` }} />
                </div>
              </div>
            )
          })}</div>
        </CardContent>
      </Card>

      {/* RAPS */}
      {scores.raps && (
        <Card className="border-2">
          <CardHeader><CardTitle className="flex items-center gap-2"><Target className="w-5 h-5 text-primary" />Revenue Achievement Probability Score (RAPS)</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center p-6 rounded-xl bg-muted/50">
              <p className="text-6xl font-bold text-primary">{scores.raps.score}%</p>
              <p className="text-muted-foreground mt-2">{scores.raps.score >= 70 ? 'High probability' : scores.raps.score >= 40 ? 'Moderate probability' : 'Low probability'} of achieving revenue target</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3 rounded-lg bg-muted/50 text-center"><p className="text-xs text-muted-foreground">Revenue Target</p><p className="font-bold mt-1">${(scores.raps.revenueTarget || 0).toLocaleString()}</p></div>
              <div className="p-3 rounded-lg bg-muted/50 text-center"><p className="text-xs text-muted-foreground">Already Invoiced</p><p className="font-bold mt-1">${(scores.raps.revenueInvoiced || 0).toLocaleString()}</p></div>
              <div className="p-3 rounded-lg bg-muted/50 text-center"><p className="text-xs text-muted-foreground">Remaining</p><p className="font-bold mt-1">${(scores.raps.revenueRemaining || 0).toLocaleString()}</p></div>
              <div className="p-3 rounded-lg bg-muted/50 text-center"><p className="text-xs text-muted-foreground">Months Left</p><p className="font-bold mt-1">{scores.raps.monthsRemaining}</p></div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Report Dialog */}
      <Dialog open={showReport} onOpenChange={setShowReport}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><FileText className="w-5 h-5 text-primary" />AI-Generated Diagnostic Report</DialogTitle>
            <DialogDescription>Powered by Claude AI</DialogDescription>
          </DialogHeader>
          {report && (
            <div className="space-y-6 py-4">
              {/* Executive Summary */}
              <div className="space-y-2">
                <h3 className="text-lg font-bold flex items-center gap-2"><Award className="w-5 h-5 text-primary" />Executive Summary</h3>
                <div className="p-4 bg-muted/50 rounded-xl text-sm leading-relaxed whitespace-pre-wrap">{report.executive_summary}</div>
              </div>
              {/* Pillar Narratives */}
              <div className="space-y-3">
                <h3 className="text-lg font-bold">Pillar Analysis</h3>
                {report.pillar_narratives && Object.entries(report.pillar_narratives).map(([pid, narrative]) => (
                  <div key={pid} className="p-4 border rounded-xl">
                    <h4 className="font-semibold text-primary mb-2">{PILLAR_NAMES[pid]}</h4>
                    <p className="text-sm text-muted-foreground">{narrative}</p>
                  </div>
                ))}
              </div>
              {/* Positioning Assessment */}
              {report.positioning_assessment && (
                <div className="space-y-2">
                  <h3 className="text-lg font-bold flex items-center gap-2"><Shield className="w-5 h-5 text-primary" />Positioning Assessment</h3>
                  <div className="p-4 bg-muted/50 rounded-xl text-sm leading-relaxed whitespace-pre-wrap">{report.positioning_assessment}</div>
                </div>
              )}
              {/* Strategic Moat */}
              {report.strategic_moat_narrative && (
                <div className="space-y-2">
                  <h3 className="text-lg font-bold">Strategic Moat Score: {report.strategic_moat_score}/10</h3>
                  <div className="p-4 bg-muted/50 rounded-xl text-sm leading-relaxed">{report.strategic_moat_narrative}</div>
                </div>
              )}
              {/* RAPS Narrative */}
              {report.raps_narrative && (
                <div className="space-y-2">
                  <h3 className="text-lg font-bold flex items-center gap-2"><TrendingUp className="w-5 h-5 text-primary" />Revenue Achievement Analysis</h3>
                  <div className="p-4 bg-muted/50 rounded-xl text-sm leading-relaxed whitespace-pre-wrap">{report.raps_narrative}</div>
                  {report.raps_improvement_scenario && (
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl text-sm">
                      <p className="font-semibold text-green-700 dark:text-green-400 mb-1">Improvement Scenario</p>
                      <p className="text-green-600 dark:text-green-300">{report.raps_improvement_scenario}</p>
                    </div>
                  )}
                </div>
              )}
              {/* Action Plan */}
              {report.action_plan && (
                <div className="space-y-3">
                  <h3 className="text-lg font-bold flex items-center gap-2"><Target className="w-5 h-5 text-primary" />30-60-90 Day Action Plan</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                      <h4 className="font-semibold text-red-700 dark:text-red-400 mb-2">{report.action_plan.phase1_title}</h4>
                      <ul className="space-y-1">{(report.action_plan.phase1_items || []).map((item, i) => (
                        <li key={i} className="text-sm flex items-start gap-2"><span className="text-red-500 mt-1">•</span>{item}</li>
                      ))}</ul>
                    </div>
                    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                      <h4 className="font-semibold text-amber-700 dark:text-amber-400 mb-2">{report.action_plan.phase2_title}</h4>
                      <ul className="space-y-1">{(report.action_plan.phase2_items || []).map((item, i) => (
                        <li key={i} className="text-sm flex items-start gap-2"><span className="text-amber-500 mt-1">•</span>{item}</li>
                      ))}</ul>
                    </div>
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                      <h4 className="font-semibold text-green-700 dark:text-green-400 mb-2">{report.action_plan.phase3_title}</h4>
                      <ul className="space-y-1">{(report.action_plan.phase3_items || []).map((item, i) => (
                        <li key={i} className="text-sm flex items-start gap-2"><span className="text-green-500 mt-1">•</span>{item}</li>
                      ))}</ul>
                    </div>
                  </div>
                </div>
              )}
              {/* Market Report */}
              {report.market_report?.countries?.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-bold flex items-center gap-2"><Gauge className="w-5 h-5 text-primary" />Market Opportunity Analysis</h3>
                  {report.market_report.countries.map((country, ci) => (
                    <Card key={ci} className="border">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center justify-between">
                          <span>{country.name}</span>
                          <Badge variant={country.growth_propensity === 'High' ? 'default' : country.growth_propensity === 'Medium-High' ? 'secondary' : 'outline'}>{country.growth_propensity} Growth</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {country.dimensions?.map((dim, di) => (
                          <div key={di}>
                            <p className="text-sm font-medium">{dim.name}</p>
                            <ul className="text-xs text-muted-foreground space-y-0.5 ml-3">{(dim.findings || []).map((f, fi) => <li key={fi}>• {f}</li>)}</ul>
                          </div>
                        ))}
                        <div className="pt-2 border-t text-sm">
                          <p><span className="font-medium">Key Drivers:</span> {country.key_drivers}</p>
                          <p><span className="font-medium">Risks:</span> {country.risks}</p>
                          <p><span className="font-medium">Strategic Implications:</span> {country.strategic_implications}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground text-center pt-4">Generated {report.generated_at ? new Date(report.generated_at).toLocaleString() : 'recently'}</p>
            </div>
          )}
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => { setShowReport(false); setShowSendDialog(true) }}>
              <Mail className="w-4 h-4 mr-2" />Send to Client
            </Button>
            <Button variant="outline" onClick={downloadPdf} disabled={downloadingPdf}>
              {downloadingPdf ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}Download PDF
            </Button>
            <Button variant="outline" onClick={() => setShowReport(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send to Client Dialog */}
      <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Mail className="w-5 h-5 text-primary" />Send Report to Client</DialogTitle>
            <DialogDescription>Email the PDF report directly to your client</DialogDescription>
          </DialogHeader>
          <form onSubmit={sendToClient} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="recipient-email">Recipient Email *</Label>
              <Input 
                id="recipient-email" 
                type="email" 
                value={emailForm.email} 
                onChange={e => setEmailForm({...emailForm, email: e.target.value})}
                placeholder="client@company.com"
                required
                data-testid="send-email-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email-message">Personal Message (optional)</Label>
              <Textarea 
                id="email-message" 
                value={emailForm.message} 
                onChange={e => setEmailForm({...emailForm, message: e.target.value})}
                placeholder="Add a personal note to your client..."
                rows={3}
              />
            </div>
            <div className="p-3 rounded-lg bg-muted/50 text-sm">
              <p className="text-muted-foreground">The email will include:</p>
              <ul className="mt-2 space-y-1 text-muted-foreground">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-green-500" />RAD Score: <span className="font-medium text-foreground">{scores?.radScore}</span></li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-green-500" />Full PDF report attached</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-green-500" />Sent from: <span className="font-medium text-foreground">{profile?.full_name || profile?.email}</span></li>
              </ul>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowSendDialog(false)}>Cancel</Button>
              <Button type="submit" disabled={sendingEmail} data-testid="send-email-btn">
                {sendingEmail ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending...</> : <><Send className="w-4 h-4 mr-2" />Send Report</>}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ===== PUBLIC ASSESSMENT =====
function PublicAssessPage({ token }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [screenerResponses, setScreenerResponses] = useState({})
  const [diagnosticResponses, setDiagnosticResponses] = useState({})
  const [phase, setPhase] = useState('screener') // screener | diagnostic | complete
  const [currentSection, setCurrentSection] = useState(0)
  const [currentPillar, setCurrentPillar] = useState(0)
  const [saving, setSaving] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const saveTimeout = useRef(null)

  useEffect(() => {
    // Support demo mode tokens
    if (token.startsWith('demo-token')) {
      const project = DEMO_PROJECTS.find(p => p.questionnaire_link?.token === token)
      if (!project) { setError('Invalid or expired link'); setLoading(false); return }
      if (project.questionnaire_link.status === 'completed') { setSubmitted(true); setLoading(false); return }
      const assessment = project.latest_assessment
      setData({ token, status: project.questionnaire_link.status, project_name: project.company_name })
      setScreenerResponses(assessment?.screener_responses || {})
      setDiagnosticResponses(assessment?.diagnostic_responses || {})
      setLoading(false)
      return
    }
    // Real API call
    fetch(`/api/assess/${token}`).then(r => r.json()).then(d => {
      if (d.error) { setError(d.error); setLoading(false); return }
      if (d.completed) { setSubmitted(true); setLoading(false); return }
      setData(d)
      setScreenerResponses(d.screener_responses || {})
      setDiagnosticResponses(d.diagnostic_responses || {})
      setLoading(false)
    }).catch(() => { setError('Failed to load'); setLoading(false) })
  }, [token])

  function autoSave(sResp, dResp) {
    if (saveTimeout.current) clearTimeout(saveTimeout.current)
    saveTimeout.current = setTimeout(async () => {
      setSaving(true)
      try {
        // Skip API call for demo tokens
        if (token.startsWith('demo-token')) {
          // Just simulate save for demo mode
          await new Promise(r => setTimeout(r, 200))
        } else {
          await fetch(`/api/assess/${token}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ screener_responses: sResp, diagnostic_responses: dResp, progress: { phase, section: phase === 'screener' ? currentSection : currentPillar } }) })
        }
      }
      catch (e) {} finally { setSaving(false) }
    }, 800)
  }

  function updateScreener(qId, value) {
    const newR = { ...screenerResponses, [qId]: value }
    setScreenerResponses(newR)
    autoSave(newR, diagnosticResponses)
  }

  function updateDiagnostic(qId, value) {
    const newR = { ...diagnosticResponses, [qId]: value }
    setDiagnosticResponses(newR)
    autoSave(screenerResponses, newR)
  }

  async function handleFinalSubmit() {
    // Demo mode submission
    if (token.startsWith('demo-token')) {
      await new Promise(r => setTimeout(r, 1000))
      toast.success('Assessment submitted successfully!')
      setSubmitted(true)
      return
    }
    // Real API submission
    await fetch(`/api/assess/${token}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ screener_responses: screenerResponses, diagnostic_responses: diagnosticResponses }) })
    await fetch(`/api/assess/${token}/submit`, { method: 'POST', headers: { 'Content-Type': 'application/json' } })
    setSubmitted(true)
  }

  if (loading) return <LoadingScreen />
  if (error) return <div className="min-h-screen flex items-center justify-center p-4"><Card className="max-w-md w-full border-2"><CardContent className="pt-6 text-center"><AlertTriangle className="w-12 h-12 mx-auto text-destructive mb-4" /><h2 className="text-xl font-bold">Link Not Valid</h2><p className="text-muted-foreground mt-2">{error}</p></CardContent></Card></div>
  if (submitted) return (
    <div className="min-h-screen flex items-center justify-center p-4"><Card className="max-w-md w-full border-2"><CardContent className="pt-6 text-center">
      <CheckCircle2 className="w-16 h-16 mx-auto text-green-500 mb-4" />
      <h2 className="text-2xl font-bold">Thank You!</h2>
      <p className="text-muted-foreground mt-2">Your responses have been submitted. Your advisor will share the results with you.</p>
    </CardContent></Card></div>
  )

  const salesModel = screenerResponses.q10 || 'Direct Sales'

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-3"><div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center"><Zap className="w-5 h-5 text-primary-foreground" /></div><span className="font-bold text-lg">Biz Ascend RAD&trade;</span></div>
          <div className="text-sm text-muted-foreground">{saving ? 'Saving...' : 'Auto-saved'}</div>
        </div>
      </header>
      <div className="container max-w-3xl py-8 space-y-6">
        <Tabs value={phase} onValueChange={setPhase}>
          <TabsList className="grid w-full grid-cols-2"><TabsTrigger value="screener">Screener</TabsTrigger><TabsTrigger value="diagnostic">Diagnostic</TabsTrigger></TabsList>
          <TabsContent value="screener" className="space-y-6 mt-6">
            <Progress value={((currentSection + 1) / SCREENER_SECTIONS.length) * 100} className="h-2" />
            <Card className="border-2"><CardContent className="p-6 space-y-6">
              <h2 className="text-xl font-bold">{SCREENER_SECTIONS[currentSection]?.title}</h2>
              {SCREENER_SECTIONS[currentSection]?.questions.map(q => (
                <div key={q.id} className="space-y-2">
                  <Label className="text-base">{q.label} {q.required && <span className="text-destructive">*</span>}</Label>
                  {q.type === 'text' && <Input value={screenerResponses[q.id] || ''} onChange={e => updateScreener(q.id, e.target.value)} />}
                  {q.type === 'email' && <Input type="email" value={screenerResponses[q.id] || ''} onChange={e => updateScreener(q.id, e.target.value)} />}
                  {q.type === 'textarea' && <Textarea value={screenerResponses[q.id] || ''} onChange={e => updateScreener(q.id, e.target.value)} placeholder={q.placeholder} rows={3} />}
                  {q.type === 'radio' && <RadioGroup value={screenerResponses[q.id] || ''} onValueChange={v => updateScreener(q.id, v)}>{q.options.map(o => <div key={o} className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50"><RadioGroupItem value={o} id={`pub-${q.id}-${o}`} /><Label htmlFor={`pub-${q.id}-${o}`} className="flex-1 cursor-pointer text-sm">{o}</Label></div>)}</RadioGroup>}
                  {q.type === 'select' && <Select value={screenerResponses[q.id] || ''} onValueChange={v => updateScreener(q.id, v)}><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger><SelectContent><ScrollArea className="h-[250px]">{(q.options === 'INDUSTRIES' ? INDUSTRIES : q.options === 'MONTHS' ? MONTHS : q.options || []).map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</ScrollArea></SelectContent></Select>}
                  {q.type === 'checkbox' && <div className="space-y-2">{q.options.map(o => <div key={o} className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50"><Checkbox id={`pub-${q.id}-${o}`} checked={(screenerResponses[q.id] || []).includes(o)} onCheckedChange={c => { const cur = screenerResponses[q.id] || []; updateScreener(q.id, c ? [...cur, o] : cur.filter(v => v !== o)) }} /><Label htmlFor={`pub-${q.id}-${o}`} className="flex-1 cursor-pointer text-sm">{o}</Label></div>)}</div>}
                  {q.type === 'currency' && <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span><Input value={screenerResponses[q.id] || ''} onChange={e => updateScreener(q.id, e.target.value.replace(/[^\d.,]/g, ''))} placeholder={q.placeholder} className="pl-7" /></div>}
                  {q.type === 'multiselect' && <Input value={screenerResponses[q.id] || ''} onChange={e => updateScreener(q.id, e.target.value)} placeholder="Enter countries separated by commas" />}
                </div>
              ))}
            </CardContent></Card>
            <div className="flex justify-between">
              <Button variant="outline" disabled={currentSection === 0} onClick={() => setCurrentSection(currentSection - 1)}>Back</Button>
              {currentSection < SCREENER_SECTIONS.length - 1 ? <Button onClick={() => setCurrentSection(currentSection + 1)}>Next</Button> : <Button onClick={() => { setPhase('diagnostic'); setCurrentPillar(0) }}>Continue to Diagnostic</Button>}
            </div>
          </TabsContent>
          <TabsContent value="diagnostic" className="space-y-6 mt-6">
            <Progress value={((currentPillar + 1) / DIAGNOSTIC_PILLARS.length) * 100} className="h-2" />
            <Card className="border-2"><CardContent className="p-6 space-y-8">
              <h2 className="text-xl font-bold">{DIAGNOSTIC_PILLARS[currentPillar]?.name}</h2>
              {DIAGNOSTIC_PILLARS[currentPillar]?.questions.map((rawQ, qi) => {
                const q = rawQ.type === 'conditional' ? { text: (rawQ.variants[salesModel] || rawQ.variants['Direct Sales']).text, options: (rawQ.variants[salesModel] || rawQ.variants['Direct Sales']).options, type: 'scored' } : rawQ
                return (
                  <div key={rawQ.id} className="space-y-3">
                    <p className="font-medium">{qi + 1}. {q.text}</p>
                    {q.type === 'scored' && q.options && <div className="space-y-2">{q.options.map((opt, oi) => (
                      <button key={oi} onClick={() => updateDiagnostic(rawQ.id, opt.s)}
                        className={`w-full text-left p-3 rounded-xl border-2 transition-all text-sm ${diagnosticResponses[rawQ.id] === opt.s ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'}`}>
                        {opt.l}
                      </button>
                    ))}</div>}
                    {q.type === 'qualitative' && <Textarea value={diagnosticResponses[rawQ.id] || ''} onChange={e => updateDiagnostic(rawQ.id, e.target.value)} rows={4} />}
                  </div>
                )
              })}
            </CardContent></Card>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => currentPillar === 0 ? setPhase('screener') : setCurrentPillar(currentPillar - 1)}>Back</Button>
              {currentPillar < DIAGNOSTIC_PILLARS.length - 1 ? <Button onClick={() => setCurrentPillar(currentPillar + 1)}>Next Pillar</Button> : <Button onClick={handleFinalSubmit} className="bg-green-600 hover:bg-green-700"><CheckCircle2 className="w-4 h-4 mr-2" />Submit Assessment</Button>}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

// ===== NOT FOUND =====
function NotFoundPage() {
  const { navigate } = useAuth()
  return (
    <div className="text-center py-20"><AlertTriangle className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" /><h2 className="text-2xl font-bold">Page Not Found</h2><p className="text-muted-foreground mt-2">The page you&apos;re looking for doesn&apos;t exist.</p><Button className="mt-6" onClick={() => navigate('/dashboard')}>Go to Dashboard</Button></div>
  )
}

// ===== MAIN APP =====
export default function App() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [demoActive, setDemoActive] = useState(false)
  const { hash, navigate } = useRouter()

  function enterDemoMode() {
    setDemoMode(true)
    setDemoActive(true)
    setUser({ id: 'demo-auth-001', email: 'admin@bizascend.com' })
    setProfile(DEMO_PROFILE)
    setLoading(false)
    navigate('/dashboard')
    toast.success('Welcome to Demo Mode!', { description: 'Explore the full platform with sample data' })
  }

  useEffect(() => {
    checkAuth()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') checkAuth()
      if (event === 'SIGNED_OUT') { setUser(null); setProfile(null); setDemoMode(false); setDemoActive(false); navigate('/login') }
    })
    return () => subscription?.unsubscribe()
  }, [])

  async function checkAuth() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUser(session.user)
        const profileData = await apiFetch('/auth/me')
        setProfile(profileData)
        if (hash === '/login' || hash === '') navigate('/dashboard')
      } else {
        if (!hash.startsWith('/assess/') && !demoActive) navigate('/login')
      }
    } catch (e) {
      console.error('Auth check error:', e)
      if (!hash.startsWith('/assess/') && !demoActive) navigate('/login')
    } finally { setLoading(false) }
  }

  // Public assessment route - no auth needed
  const assessMatch = hash.match(/^\/assess\/([^/]+)/)
  if (assessMatch) return <PublicAssessPage token={assessMatch[1]} />

  if (loading && !demoActive) return <LoadingScreen />
  if ((hash === '/login' || !user) && !demoActive) return <LoginPage onSuccess={checkAuth} onDemo={enterDemoMode} />

  const route = matchRoute(hash)

  return (
    <AuthContext.Provider value={{ user, profile, navigate, hash }}>
      <AppShell>
        {route.page === 'dashboard' && <DashboardPage />}
        {route.page === 'admin-users' && profile?.role === 'admin' && <AdminUsersPage />}
        {route.page === 'admin-users' && profile?.role !== 'admin' && <NotFoundPage />}
        {route.page === 'admin-organization' && profile?.role === 'admin' && <OrganizationSettingsPage />}
        {route.page === 'admin-organization' && profile?.role !== 'admin' && <NotFoundPage />}
        {route.page === 'projects' && <ProjectsListPage />}
        {route.page === 'create-project' && <CreateProjectPage />}
        {route.page === 'project-detail' && <ProjectDetailPage id={route.id} />}
        {route.page === 'screener' && <ScreenerPage id={route.id} />}
        {route.page === 'diagnostic' && <DiagnosticPage id={route.id} />}
        {route.page === 'scores' && <ScoresPage id={route.id} />}
        {route.page === 'not-found' && <NotFoundPage />}
      </AppShell>
    </AuthContext.Provider>
  )
}
