'use client'
import { useState, useEffect, useCallback, createContext, useContext, useRef, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { useCustomTheme } from './providers'
import { toast } from 'sonner'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  LayoutDashboard, FolderKanban, Users, LogOut, Sun, Moon, Zap, Plus, Search,
  ChevronRight, ArrowLeft, Activity as ActivityIcon, CheckCircle2, Clock, AlertTriangle, Copy,
  PanelLeftClose, PanelLeftOpen, MoreVertical, Building2, FileText, Link2,
  TrendingUp, Shield, Trash2, Edit, BarChart3, Eye, EyeOff, ChevronLeft, Menu, X,
  Target, Award, Gauge, RefreshCw, ExternalLink, Save, Loader2, Download, FileSpreadsheet, Mail, Send, Settings, Building,
  ArrowUpRight, Bell, Briefcase
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Cell, AreaChart, Area, Tooltip as RechartsTooltip } from 'recharts'
import { INDUSTRIES, SCREENER_SECTIONS, DIAGNOSTIC_PILLARS, MATURITY_BANDS, PILLAR_NAMES, FREE_EMAIL_DOMAINS, MONTHS } from '@/lib/constants'
import { DEMO_PROFILE, DEMO_USERS, DEMO_PROJECTS, DEMO_STATS, DEMO_ACTIVITY, demoApiFetch } from '@/lib/mockData'
import { cn, getMaturityBand } from '@/lib/utils'
import { generateClientPdf } from '@/lib/generatePdf'

const pillarLabel = (pid) => `Pillar ${pid.replace('p', '')} - ${PILLAR_NAMES[pid] || pid}`
import { GlassCard, StatCard, GlowEffect, StatusBadge as UIStatusBadge, PageSkeleton as UIPageSkeleton } from '@/components/shared/ui-helpers'

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
  const [hash, setHash] = useState(() => (typeof window !== 'undefined' ? window.location.hash.slice(1) : '') || '/login')
  useEffect(() => {
    const update = () => setHash(window.location.hash.slice(1) || '/login')
    window.addEventListener('hashchange', update)
    return () => window.removeEventListener('hashchange', update)
  }, [])
  const navigate = useCallback((path) => { window.location.hash = path }, [])
  return { hash, navigate }
}

function matchRoute(hash) {
  if (hash === '/dashboard' || hash === '/') return { page: 'dashboard' }
  if (hash === '/signup') return { page: 'signup' }
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
  'bg-blue-700 text-white dark:bg-card dark:text-card-foreground border-blue-800 dark:border-primary/20',
  'bg-emerald-700 text-white dark:bg-card dark:text-card-foreground border-emerald-800 dark:border-primary/20',
  'bg-zinc-900 text-white dark:bg-card dark:text-card-foreground border-zinc-800 dark:border-primary/20',
  'bg-red-700 text-white dark:bg-card dark:text-card-foreground border-red-800 dark:border-primary/20',
  'bg-violet-700 text-white dark:bg-card dark:text-card-foreground border-violet-800 dark:border-primary/20',
  'bg-sky-700 text-white dark:bg-card dark:text-card-foreground border-sky-800 dark:border-primary/20',
]

function StatusBadge({ status }) {
  const styles = {
    in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
    completed: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
    not_started: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    active: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
    expired: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
  }
  const labels = { in_progress: 'In Progress', completed: 'Completed', not_started: 'Not Started', active: 'Active', expired: 'Expired' }
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium uppercase ${styles[status] || styles.in_progress}`}>{labels[status] || status}</span>
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
  const [showPassword, setShowPassword] = useState(false)

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
    <div className="min-h-screen flex items-center justify-center p-4 relative bg-white">
      <div className="w-full max-w-md space-y-8 relative z-10">
        <div className="text-center space-y-2">
          <div className="mx-auto">
            <img src="/logo.jpeg" alt="Biz Ascend" className="h-16 object-contain mx-auto" />
          </div>
          <p className="text-gray-500">Revenue Acceleration Diagnostic (RAD)</p>
        </div>
        <Card className="border border-gray-200 bg-white shadow-2xl shadow-black/20 login-card">
          <CardContent className="pt-6">
            <form onSubmit={handleLogin} className="space-y-4">
              {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-200">{error}</div>}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 font-medium">Email</Label>
                <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" required className="h-11 bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-primary focus:ring-primary" data-testid="login-email-input" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-gray-700 font-medium">Password</Label>
                  <button type="button" onClick={() => setShowForgotPassword(true)} className="text-xs text-primary hover:underline font-medium" data-testid="forgot-password-link">
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" required className="h-11 pr-10 bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-primary focus:ring-primary" data-testid="login-password-input" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" data-testid="login-toggle-password">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full h-11 text-base font-semibold bg-primary hover:bg-primary/90 text-white" disabled={loading} data-testid="login-submit-btn">
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Signing in...</> : 'Sign In'}
              </Button>
            </form>
          </CardContent>
        </Card>
        <Button type="button" variant="outline" className="w-full h-11 border-gray-300 text-gray-700 hover:bg-gray-50" onClick={onDemo} data-testid="explore-demo-btn">
          <Eye className="w-4 h-4 mr-2" />Explore Demo
        </Button>
        <p className="text-center text-sm text-gray-500">Don&apos;t have an account?{' '}
          <a href="#/signup" className="text-primary hover:underline font-medium" data-testid="signup-link">Create account</a>
        </p>
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
    <div className="min-h-screen flex items-center justify-center p-4 relative bg-white">
      <div className="w-full max-w-md space-y-8 relative z-10">
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/25">
            <Zap className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Reset Password</h1>
          <p className="text-gray-500">
            {sent ? "Check your inbox for the reset link" : "Enter your email to receive a reset link"}
          </p>
        </div>
        <Card className="border border-gray-200 bg-white shadow-2xl shadow-black/20 login-card">
          <CardContent className="pt-6 space-y-6">
            {sent ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-center">
                  <CheckCircle2 className="w-8 h-8 mx-auto text-green-500 mb-2" />
                  <p className="text-green-700 font-medium">Reset link sent!</p>
                  <p className="text-sm text-gray-500 mt-1">We've sent a password reset link to <strong className="text-gray-700">{email}</strong></p>
                </div>
                <p className="text-xs text-gray-400 text-center">
                  Didn't receive the email? Check your spam folder or try again.
                </p>
                <Button variant="outline" className="w-full border-gray-300 text-gray-700 hover:bg-gray-50" onClick={() => setSent(false)}>
                  Try another email
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email" className="text-gray-700 font-medium">Email Address</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="h-11 bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-primary focus:ring-primary"
                    data-testid="forgot-email-input"
                  />
                </div>
                <Button type="submit" className="w-full h-11 bg-primary hover:bg-primary/90 text-white" disabled={loading} data-testid="forgot-submit-btn">
                  {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending...</> : 'Send Reset Link'}
                </Button>
              </form>
            )}
            <Button variant="ghost" className="w-full text-gray-600 hover:text-gray-900 hover:bg-gray-50" onClick={onBack} data-testid="back-to-login-btn">
              <ArrowLeft className="w-4 h-4 mr-2" />Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ===== SIGNUP PAGE =====
function SignupPage({ onSuccess, onDemo }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  async function handleSignup(e) {
    e.preventDefault()
    setError('')
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    setLoading(true)
    try {
      const { error: authErr } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name, role: 'consultant' } }
      })
      if (authErr) throw authErr
      toast.success('Account created! Check your email to verify your account.', { description: 'A verification link has been sent to your inbox.', duration: 6000 })
      onSuccess()
    } catch (err) { setError(err.message || 'Signup failed') } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative bg-white">
      <div className="w-full max-w-md space-y-8 relative z-10">
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/25">
            <Zap className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Create Account</h1>
          <p className="text-gray-500">Join Biz Ascend RAD&trade; Platform</p>
        </div>
        <Card className="border border-gray-200 bg-white shadow-2xl shadow-black/20 login-card">
          <CardContent className="pt-6">
            <form onSubmit={handleSignup} className="space-y-4">
              {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-200">{error}</div>}
              <div className="space-y-2">
                <Label htmlFor="signup-name" className="text-gray-700 font-medium">Full Name</Label>
                <Input id="signup-name" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" required className="h-11 bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-primary focus:ring-primary" data-testid="signup-name-input" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-email" className="text-gray-700 font-medium">Email</Label>
                <Input id="signup-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" required className="h-11 bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-primary focus:ring-primary" data-testid="signup-email-input" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password" className="text-gray-700 font-medium">Password</Label>
                <div className="relative">
                  <Input id="signup-password" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 6 characters" required className="h-11 pr-10 bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-primary focus:ring-primary" data-testid="signup-password-input" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" data-testid="signup-toggle-password">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-confirm" className="text-gray-700 font-medium">Confirm Password</Label>
                <div className="relative">
                  <Input id="signup-confirm" type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Re-enter your password" required className="h-11 pr-10 bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-primary focus:ring-primary" data-testid="signup-confirm-input" />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" data-testid="signup-toggle-confirm">
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full h-11 text-base font-semibold bg-primary hover:bg-primary/90 text-white" disabled={loading} data-testid="signup-submit-btn">
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating account...</> : 'Create Account'}
              </Button>
            </form>
          </CardContent>
        </Card>
        <Button type="button" variant="outline" className="w-full h-11 border-gray-300 text-gray-700 hover:bg-gray-50" onClick={onDemo} data-testid="explore-demo-btn">
          <Eye className="w-4 h-4 mr-2" />Explore Demo
        </Button>
        <p className="text-center text-sm text-gray-500">Already have an account?{' '}
          <a href="#/login" className="text-primary hover:underline font-medium" data-testid="login-link">Sign In</a>
        </p>
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
        {(sidebarOpen || mobileOpen) && <span className="font-bold text-lg bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">Biz Ascend RAD&trade;</span>}
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
const ACTION_ICONS = {
  'project_created': FolderKanban,
  'project_updated': Clock,
  'project_completed': CheckCircle2,
  'user_login': ActivityIcon,
  'score_generated': Zap,
}

function DashboardPage() {
  const { profile, navigate } = useAuth()
  const { data: stats, isLoading: statsLoading } = useQuery({ queryKey: ['stats'], queryFn: () => apiFetch('/admin/stats') })
  const { data: activityData, isLoading: activityLoading } = useQuery({ queryKey: ['activity'], queryFn: () => apiFetch('/activity') })
  const { data: projects, isLoading: projectsLoading } = useQuery({ queryKey: ['projects'], queryFn: () => apiFetch('/projects') })

  if (statsLoading) return <UIPageSkeleton />

  const isAdmin = profile?.role === 'admin'
  const activities = activityData?.activities || []
  
  const statCards = isAdmin ? [
    { label: 'Total Projects', value: stats?.total_projects || 0, icon: FolderKanban, color: 'text-primary', trend: 12 },
    { label: 'Incomplete Assessments', value: stats?.active_diagnostics || 0, icon: ActivityIcon, color: 'text-blue-500', trend: -3 },
    { label: 'Completed', value: stats?.completed_diagnostics || 0, icon: CheckCircle2, color: 'text-emerald-500', trend: 8 },
    { label: 'Consultants', value: stats?.total_consultants || 0, icon: Building2, color: 'text-violet-500', trend: 5 },
  ] : [
    { label: 'My Projects', value: projects?.length || 0, icon: FolderKanban, color: 'text-primary', trend: 5 },
    { label: 'Completed', value: projects?.filter(p => p.status === 'completed').length || 0, icon: CheckCircle2, color: 'text-emerald-500', trend: 2 },
    { label: 'Active', value: projects?.filter(p => p.status === 'active' || p.status === 'in_progress').length || 0, icon: Clock, color: 'text-blue-500', trend: -1 },
    { label: 'Reports', value: projects?.filter(p => p.report_generated).length || 0, icon: Zap, color: 'text-amber-500', trend: 3 },
  ]

  const sectorData = stats?.sectors ? Object.entries(stats.sectors).map(([name, value]) => ({ name, value })) : []
  const COLORS = ['#800000', '#990000', '#7a1a1a', '#660000', '#8b0000', '#a52a2a']

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 p-3 rounded-2xl shadow-2xl">
          <p className="font-semibold text-xs text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
          <p className="text-xl font-bold tracking-tight">{payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  const formatActivityDetails = (details) => {
    if (!details) return 'Action completed successfully';
    if (typeof details === 'string') return details;
    if (typeof details === 'object' && Object.keys(details).length > 0) {
      if (details.status) return `Status updated to ${details.status}`;
      if (details.industry) return `Industry set to ${details.industry}`;
      return 'System event recorded';
    }
    return 'Action completed successfully';
  };

  return (
    <div className="relative space-y-8 bg-transparent px-2">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 right-0 w-[400px] h-[400px] bg-blue-500/5 blur-[100px] rounded-full pointer-events-none -z-10" />

      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pt-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-primary font-bold tracking-[0.2em] uppercase text-[10px]">
            <LayoutDashboard className="w-3 h-3" />
            Executive Dashboard
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Welcome, <span className="text-primary">{profile?.name?.split(' ')[0] || 'User'}</span>
          </h1>
          <p className="text-muted-foreground font-medium max-w-xl">
            Platform metrics are showing strong growth across all sectors.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 rounded-2xl px-3 py-2 shadow-sm">
            <Search className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground pr-8">Search anything...</span>
            <kbd className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded border">⌘K</kbd>
          </div>
          <Button variant="outline" size="icon" className="rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900">
            <Bell className="w-4 h-4" />
          </Button>
          {!isAdmin && (
            <Button className="rounded-2xl shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all font-semibold px-6 h-11" onClick={() => navigate('/projects/new')}>
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Button>
          )}
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <StatCard key={i} {...stat} className={cn(
            "animate-in fade-in slide-in-from-bottom-4 duration-700",
            i === 0 ? "delay-0" : i === 1 ? "delay-100" : i === 2 ? "delay-200" : "delay-300"
          )} />
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <div className="xl:col-span-2 space-y-8">
          <Tabs defaultValue="analytics" className="w-full">
            <div className="flex items-center justify-between mb-6">
              <TabsList className="bg-zinc-100 dark:bg-zinc-900 p-1 rounded-2xl border border-zinc-200 dark:border-zinc-800 h-11">
                <TabsTrigger value="analytics" className="rounded-xl px-6 font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-sm">Overview</TabsTrigger>
                <TabsTrigger value="activity" className="rounded-xl px-6 font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-sm">Activity</TabsTrigger>
              </TabsList>
              <Button variant="ghost" size="sm" className="rounded-xl font-semibold text-muted-foreground gap-2">
                Last 30 Days
                <ChevronRight className="w-4 h-4 rotate-90" />
              </Button>
            </div>

            <TabsContent value="analytics" className="m-0 focus-visible:outline-none">
              <div className="grid gap-8">
                {isAdmin ? (
                  <GlassCard className="p-0 border-none bg-transparent shadow-none hover:translate-y-0">
                    <CardHeader className="pt-0 pb-6 flex flex-row items-center justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-xl font-bold tracking-tight">Industry Distribution</CardTitle>
                        <CardDescription>Live breakdown of projects across key economic sectors</CardDescription>
                      </div>
                      <Badge variant="secondary" className="rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none font-bold uppercase tracking-widest text-[10px] px-2.5 py-1">
                        Real-time
                      </Badge>
                    </CardHeader>
                    <GlassCard className="p-8 min-h-[400px]">
                      {sectorData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={320}>
                          <BarChart data={sectorData} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
                            <defs>
                              {COLORS.map((color, i) => (
                                <linearGradient key={`grad-${i}`} id={`barGrad-${i}`} x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor={color} stopOpacity={1} />
                                  <stop offset="100%" stopColor={color} stopOpacity={0.4} />
                                </linearGradient>
                              ))}
                            </defs>
                            <CartesianGrid strokeDasharray="8 8" stroke="currentColor" className="text-zinc-200 dark:text-zinc-800" vertical={false} />
                            <XAxis
                              dataKey="name"
                              axisLine={false}
                              tickLine={false}
                              tick={{ fill: 'currentColor', fontSize: 10, fontWeight: 600 }}
                              angle={-25}
                              textAnchor="end"
                              dy={10}
                              interval={0}
                              className="text-muted-foreground"
                            />
                            <YAxis 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fill: 'currentColor', fontSize: 11, fontWeight: 600 }}
                              className="text-muted-foreground"
                            />
                            <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'currentColor', opacity: 0.05 }} />
                            <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={45}>
                              {sectorData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={`url(#barGrad-${index % COLORS.length})`} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-[320px] flex flex-col items-center justify-center text-muted-foreground gap-4">
                          <div className="p-6 rounded-3xl bg-zinc-100 dark:bg-zinc-800/50">
                            <BarChart3 className="w-12 h-12 opacity-20" />
                          </div>
                          <p className="font-medium">Collecting sector-specific data...</p>
                        </div>
                      )}
                    </GlassCard>
                  </GlassCard>
                ) : (
                  <GlassCard className="p-10 bg-gradient-to-br from-primary/10 via-transparent to-blue-500/5 border-primary/10 hover:translate-y-0 shadow-sm">
                    <div className="flex flex-col md:flex-row gap-10 items-center">
                      <div className="space-y-6 flex-1">
                        <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none px-3 py-1 rounded-full font-bold tracking-[0.15em] text-[10px] uppercase">
                          Revenue Acceleration
                        </Badge>
                        <h2 className="text-3xl font-bold tracking-tight leading-tight">
                          Unlock hidden growth potential in your business model
                        </h2>
                        <p className="text-muted-foreground text-lg leading-relaxed font-medium">
                          Our RAD™ diagnostic identifies bottlenecks and reveals scaling opportunities within minutes.
                        </p>
                        <Button size="lg" className="rounded-2xl font-bold px-8 h-12 shadow-xl shadow-primary/20" onClick={() => navigate('/projects/new')}>
                          Run New Diagnostic
                          <ArrowUpRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                      <div className="relative hidden md:block">
                        <div className="absolute inset-0 bg-primary/20 blur-[80px] rounded-full animate-pulse" />
                        <div className="relative p-10 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[3rem] shadow-2xl">
                          <Zap className="w-20 h-20 text-primary" />
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                )}
              </div>
            </TabsContent>

            <TabsContent value="activity" className="m-0 focus-visible:outline-none">
              <GlassCard className="p-8">
                <div className="space-y-6">
                  {activityLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
                    </div>
                  ) : activities.length > 0 ? (
                    activities.slice(0, 8).map((item, i) => {
                      const Icon = ACTION_ICONS[item.action_type] || ActivityIcon
                      return (
                        <div key={i} className="group relative flex items-start gap-5 p-4 rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors border border-transparent hover:border-zinc-100 dark:hover:border-zinc-800">
                          <div className="relative flex-shrink-0">
                            <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center group-hover:scale-110 group-hover:bg-primary/10 group-hover:text-primary transition-all duration-500">
                              <Icon className="w-5 h-5 stroke-[2.5px]" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0 pt-0.5">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-sm font-bold tracking-tight">{String(item.action || 'System Action')}</p>
                              <span className="text-[11px] font-semibold text-muted-foreground bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
                                {item.created_at ? new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Recently'}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground font-medium line-clamp-1">{formatActivityDetails(item.details)}</p>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="py-20 text-center space-y-4">
                      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                        <ActivityIcon className="w-8 h-8 text-muted-foreground opacity-20" />
                      </div>
                      <p className="text-muted-foreground font-medium">No activity recorded yet</p>
                    </div>
                  )}
                  <Button variant="ghost" className="w-full rounded-2xl font-bold text-sm text-muted-foreground hover:text-primary mt-4">
                    View Full Audit Log
                  </Button>
                </div>
              </GlassCard>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar Area: Projects & Quick Actions */}
        <div className="space-y-8">
          <GlassCard className="flex flex-col h-[650px]">
            <CardHeader className="flex flex-row items-center justify-between pb-6">
              <div className="space-y-1">
                <CardTitle className="text-xl font-bold tracking-tight">Recent Projects</CardTitle>
                <CardDescription className="text-xs">Your active diagnostic pipeline</CardDescription>
              </div>
              <Button variant="ghost" size="icon" className="rounded-xl hover:bg-primary/10 text-primary h-9 w-9" onClick={() => navigate('/projects')}>
                <ArrowUpRight className="w-5 h-5" />
              </Button>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-hidden flex flex-col">
              <ScrollArea className="flex-1 px-6 pb-6">
                <div className="space-y-4">
                  {projectsLoading ? (
                    Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-3xl" />)
                  ) : projects?.length > 0 ? (
                    projects.slice(0, 10).map(project => (
                      <div 
                        key={project.id} 
                        className="group flex flex-col p-6 rounded-[2rem] border border-zinc-100 dark:border-zinc-800 bg-white/40 dark:bg-zinc-900/40 hover:border-primary/30 hover:bg-primary/5 transition-all duration-500 cursor-pointer relative overflow-hidden"
                        onClick={() => navigate(`/projects/${project.id}`)}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="min-w-0">
                            <h4 className="font-bold text-lg tracking-tight truncate group-hover:text-primary transition-colors">{project.company_name}</h4>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5 opacity-60">{project.industry}</p>
                          </div>
                          <UIStatusBadge status={project.status} />
                        </div>
                        
                        <div className="space-y-2 mt-auto">
                          <div className="flex justify-between text-[10px] font-bold text-muted-foreground tracking-tight uppercase">
                            <span>Diagnostic Score</span>
                            <span className="text-primary font-black">{project.status === 'completed' ? '84/100' : 'In Progress'}</span>
                          </div>
                          <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div 
                              className={cn(
                                "h-full rounded-full transition-all duration-1000 ease-out",
                                project.status === 'completed' ? "bg-primary" : "bg-primary/40 animate-pulse"
                              )}
                              style={{ width: project.status === 'completed' ? '84%' : '45%' }}
                            />
                          </div>
                        </div>

                        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 blur-[40px] rounded-full -mr-12 -mt-12 group-hover:bg-primary/10 transition-colors" />
                      </div>
                    ))
                  ) : (
                    <div className="py-20 text-center space-y-6">
                      <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-[2rem] flex items-center justify-center mx-auto rotate-6">
                        <Briefcase className="w-8 h-8 text-muted-foreground opacity-20" />
                      </div>
                      <div className="space-y-1 px-4">
                        <p className="font-bold">No active projects</p>
                        <p className="text-xs text-muted-foreground font-medium italic">Start a diagnostic to see your first growth report</p>
                      </div>
                      <Button variant="outline" size="sm" className="rounded-xl font-bold px-6 border-zinc-200 dark:border-zinc-800" onClick={() => navigate('/projects/new')}>
                        Create Project
                      </Button>
                    </div>
                  )}
                </div>
              </ScrollArea>
              {projects?.length > 10 && (
                <div className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50">
                  <Button variant="ghost" className="w-full rounded-2xl font-bold text-xs text-muted-foreground hover:text-primary" onClick={() => navigate('/projects')}>
                    See all {projects.length} projects
                  </Button>
                </div>
              )}
            </CardContent>
          </GlassCard>

          <GlassCard className="p-6 bg-zinc-900 text-white border-none shadow-2xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
                <Settings className="w-6 h-6 text-white stroke-[2.5px]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold uppercase tracking-widest opacity-60">System Health</p>
                <p className="font-bold tracking-tight">Optimal Performance</p>
              </div>
              <ArrowUpRight className="w-5 h-5 opacity-40" />
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}

// ===== PROJECTS LIST =====
function ProjectsListPage() {
  const { navigate, profile } = useAuth()
  const queryClient = useQueryClient()
  const { data: projects, isLoading: projectsLoading } = useQuery({ queryKey: ['projects'], queryFn: () => apiFetch('/projects') })
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

  const stats = useMemo(() => {
    if (!projects) return { total: 0, active: 0, completed: 0 }
    return {
      total: projects.length,
      active: projects.filter(p => p.status === 'active' || p.status === 'in_progress').length,
      completed: projects.filter(p => p.status === 'completed').length
    }
  }, [projects])

  if (projectsLoading) return <UIPageSkeleton />

  const isAdmin = profile?.role === 'admin'

  return (
    <div className="relative space-y-8 bg-transparent px-2">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none -z-10" />
      
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pt-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-primary font-bold tracking-[0.2em] uppercase text-[10px]">
            <Briefcase className="w-3 h-3" />
            Project Management
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Organization <span className="text-primary">Portfolio</span>
          </h1>
          <p className="text-muted-foreground font-medium max-w-xl">
            Manage your diagnostic pipeline and access deep revenue insights across all active accounts.
          </p>
        </div>
        
        <Button className="rounded-2xl shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all font-semibold px-6 h-11" onClick={() => navigate('/projects/new')}>
          <Plus className="w-4 h-4 mr-2" />
          Create New Project
        </Button>
      </header>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCard label="Total Portfolio" value={stats.total} icon={FolderKanban} color="text-primary" trend={5} />
        <StatCard label="Incomplete Assessments" value={stats.active} icon={ActivityIcon} color="text-blue-500" trend={2} />
        <StatCard label="Completed" value={stats.completed} icon={CheckCircle2} color="text-emerald-500" trend={8} />
      </div>

      {/* Filter Bar */}
      <GlassCard className="p-4 md:p-6 shadow-sm border-zinc-200/50 dark:border-zinc-800/50">
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground opacity-50" />
            <Input 
              placeholder="Search by company or industry..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-11 h-12 bg-white/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 rounded-2xl focus-visible:ring-primary/20 focus-visible:border-primary transition-all"
            />
          </div>
          <div className="flex gap-3 w-full lg:w-auto">
            <div className="flex items-center gap-2 bg-white/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 h-12 shrink-0">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="border-none bg-transparent focus:ring-0 h-auto p-0 min-w-[120px] font-semibold text-sm">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-zinc-200 dark:border-zinc-800">
                  <SelectItem value="all">All Pipeline</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Projects Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((project, i) => (
            <div 
              key={project.id}
              className="animate-in fade-in slide-in-from-bottom-4 duration-500"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <GlassCard 
                className="group flex flex-col p-7 border-zinc-200/50 dark:border-zinc-800/50 hover:border-primary/30 hover:bg-primary/5 transition-all duration-500 cursor-pointer relative overflow-hidden h-full"
                onClick={() => navigate(`/projects/${project.id}`)}
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center group-hover:scale-110 group-hover:bg-primary/10 group-hover:text-primary transition-all duration-500 shadow-sm border border-zinc-200/50 dark:border-zinc-800/50">
                    <Building2 className="w-7 h-7 stroke-[1.5px]" />
                  </div>
                  <UIStatusBadge status={project.status} className="shadow-sm" />
                </div>

                <div className="space-y-1 mb-8 flex-1">
                  <h3 className="text-xl font-bold tracking-tight group-hover:text-primary transition-colors line-clamp-1">{project.company_name}</h3>
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.1em] opacity-60">{project.industry}</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold text-muted-foreground tracking-tight uppercase">
                      <span>Diagnostic Progress</span>
                      <span className="text-primary font-black">{project.status === 'completed' ? '100%' : '45%'}</span>
                    </div>
                    <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800/50 rounded-full overflow-hidden border border-zinc-200/20 dark:border-zinc-800/20">
                      <div 
                        className={cn(
                          "h-full rounded-full transition-all duration-1000 ease-out",
                          project.status === 'completed' ? "bg-emerald-500" : "bg-primary animate-pulse shadow-[0_0_10px_rgba(var(--primary),0.3)]"
                        )}
                        style={{ width: project.status === 'completed' ? '100%' : '45%' }}
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        {[1, 2].map((_, i) => (
                          <Avatar key={i} className="w-6 h-6 border-2 border-background shadow-sm">
                            <AvatarFallback className="bg-primary/10 text-[8px] font-bold text-primary">C{i+1}</AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                      <span className="text-[10px] font-semibold text-muted-foreground">{project.consultant?.name || 'Assigned'}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground/60 uppercase">
                      <Clock className="w-3 h-3" />
                      {new Date(project.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                </div>

                {/* Subtle Hover Decoration */}
                <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-primary/5 blur-[40px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              </GlassCard>
            </div>
          ))}
        </div>
      ) : (
        <GlassCard className="py-24 flex flex-col items-center justify-center text-center space-y-6">
          <div className="w-24 h-24 bg-zinc-100 dark:bg-zinc-800/50 rounded-[2.5rem] flex items-center justify-center border border-zinc-200 dark:border-zinc-800 shadow-inner rotate-6">
            <Search className="w-10 h-10 text-muted-foreground opacity-20" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold tracking-tight">No projects found</h3>
            <p className="text-muted-foreground max-w-xs mx-auto font-medium">
              Try adjusting your search filters or create a new project to start a diagnostic.
            </p>
          </div>
          <Button variant="outline" className="rounded-2xl font-bold px-8 border-zinc-200 dark:border-zinc-800" onClick={() => { setSearch(''); setStatusFilter('all'); }}>
            Reset All Filters
          </Button>
        </GlassCard>
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

  if (isLoading) return <UIPageSkeleton />
  if (!project) return <div className="text-center py-24"><GlassCard className="p-12 max-w-md mx-auto"><AlertTriangle className="w-12 h-12 text-muted-foreground opacity-20 mx-auto mb-4" /><p className="text-muted-foreground font-medium">Project intelligence not found</p><Button variant="ghost" className="mt-4" onClick={() => navigate('/projects')}>Return to Portfolio</Button></GlassCard></div>

  const assessment = project.latest_assessment
  const screenerStatus = assessment?.screener_status || 'not_started'
  const diagnosticStatus = assessment?.diagnostic_status || 'not_started'
  const scores = assessment?.scores

  async function handleArchive() {
    // Archive functionality removed - only completed/in_progress statuses supported
    setShowArchive(false)
  }

  async function generateLink() {
    setLinkLoading(true)
    try {
      await apiFetch(`/projects/${id}/link`, { method: 'POST' })
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
      toast.success('New assessment cycle initiated')
    } catch (err) { toast.error(err.message) }
  }

  return (
    <div className="relative space-y-8 bg-transparent px-2">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none -z-10" />
      
      <div className="flex items-center gap-2 text-xs font-bold tracking-[0.2em] uppercase text-muted-foreground/60">
        <button onClick={() => navigate('/projects')} className="hover:text-primary hover:underline cursor-pointer transition-colors">Portfolio</button>
        <ChevronRight className="w-3 h-3" />
        <span className="text-primary">{project.company_name}</span>
      </div>

      {/* Executive Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex items-start gap-6">
          <div className="w-20 h-20 rounded-[2rem] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl flex items-center justify-center shrink-0">
            <Building2 className="w-10 h-10 text-primary stroke-[1.5px]" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">{project.company_name}</h1>
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 px-3 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider">{project.industry}</Badge>
              <UIStatusBadge status={project.status} />
              {project.consultant && (
                <div className="flex items-center gap-2 px-3 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-full">
                  <Avatar className="w-4 h-4">
                    <AvatarFallback className="text-[8px] font-black">{project.consultant.name[0]}</AvatarFallback>
                  </Avatar>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">{project.consultant.name}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          {diagnosticStatus === 'completed' && (
            <Button variant="outline" className="rounded-2xl border-zinc-200 dark:border-zinc-800 font-bold h-11" onClick={startReassessment}>
              <RefreshCw className="w-4 h-4 mr-2" />
              New Assessment
            </Button>
          )}
          {profile?.role === 'admin' && (
            <Button variant="outline" className="rounded-2xl border-zinc-200 dark:border-zinc-800 text-destructive hover:bg-destructive/10 h-11" onClick={() => setShowArchive(true)}>
              <Trash2 className="w-4 h-4 mr-2" />
              Archive
            </Button>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-8">
          {/* Diagnostic Progress Steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { id: 'screener', title: 'Screener', status: screenerStatus, icon: FileText, desc: 'Company Context', path: `/projects/${id}/screener`, active: true },
              { id: 'diagnostic', title: 'Diagnostic', status: diagnosticStatus, icon: BarChart3, desc: 'Growth Pillars', path: `/projects/${id}/diagnostic`, active: screenerStatus === 'completed' },
              { id: 'scores', title: 'Intelligence', status: scores ? 'completed' : 'not_started', icon: Zap, desc: 'Deep Insights', path: `/projects/${id}/scores`, active: !!scores },
            ].map((step, i) => (
              <GlassCard 
                key={step.id}
                className={cn(
                  "group p-6 cursor-pointer border-zinc-200/50 dark:border-zinc-800/50 hover:bg-primary/5 transition-all duration-500",
                  !step.active && "opacity-50 grayscale cursor-not-allowed hover:bg-transparent"
                )}
                onClick={() => step.active && navigate(step.path)}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 shadow-sm border",
                    step.status === 'completed' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-primary/10 border-primary/20 text-primary"
                  )}>
                    <step.icon className="w-6 h-6 stroke-[2px]" />
                  </div>
                  <UIStatusBadge status={step.status} />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-lg tracking-tight group-hover:text-primary transition-colors">{step.title}</h3>
                  <p className="text-xs text-muted-foreground font-medium">{step.desc}</p>
                </div>
                <Button variant="ghost" className="w-full mt-6 rounded-xl font-bold text-xs group-hover:bg-primary group-hover:text-white transition-all duration-500" disabled={!step.active}>
                  {step.status === 'completed' ? 'Review Phase' : 'Continue Phase'}
                  <ChevronRight className="w-3 h-3 ml-2" />
                </Button>
              </GlassCard>
            ))}
          </div>

          {/* Scores Executive Summary */}
          {scores && (
            <GlassCard className="p-10 bg-gradient-to-br from-primary/10 via-transparent to-blue-500/5 border-primary/10 relative overflow-hidden">
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
                <div className="text-center space-y-2">
                  <div className="relative inline-block">
                    <svg className="w-40 h-40 transform -rotate-90">
                      <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-zinc-200 dark:text-zinc-800" />
                      <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={440} strokeDashoffset={440 - (440 * scores.radScore) / 100} className="text-primary" strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-5xl font-black tracking-tighter text-primary">{scores.radScore}%</span>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">RAD Score</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex-1 space-y-6 text-center md:text-left">
                  <div className="space-y-2">
                    <Badge className={cn("text-white font-black px-4 py-1 rounded-full", getMaturityBand(scores.radScore).includes('Strong') ? 'bg-band-strong' : getMaturityBand(scores.radScore).includes('Constrained') ? 'bg-band-constrained' : getMaturityBand(scores.radScore).includes('Underpowered') ? 'bg-band-underpowered' : 'bg-band-risk')}>
                      {getMaturityBand(scores.radScore).toUpperCase()}
                    </Badge>
                    <h2 className="text-3xl font-bold tracking-tight">Executive Summary Available</h2>
                    <p className="text-muted-foreground font-medium leading-relaxed">
                      The diagnostic phase is complete. We've identified <span className="text-destructive font-bold">{Object.entries(scores.pillarScores || {}).filter(([, d]) => d.score < 50).map(([pid]) => PILLAR_NAMES[pid]).join(', ') || scores.primaryConstraint?.name}</span> as the primary constraint{Object.entries(scores.pillarScores || {}).filter(([, d]) => d.score < 50).length > 1 ? 's' : ''} holding back revenue growth.
                    </p>
                  </div>
                  <Button size="lg" className="rounded-2xl font-black px-10 h-14 shadow-2xl shadow-primary/20" onClick={() => navigate(`/projects/${id}/scores`)}>
                    VIEW FULL INTELLIGENCE REPORT
                    <ArrowUpRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              </div>
              
              <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-primary/10 blur-[100px] rounded-full pointer-events-none" />
            </GlassCard>
          )}

          {/* Questionnaire Access */}
          <GlassCard className="p-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
                    <Link2 className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-bold tracking-tight">Client Access Terminal</h3>
                </div>
                <p className="text-muted-foreground font-medium">Share this unique, secure entry point with the organization's executive team.</p>
              </div>
              
              <div className="w-full md:w-auto flex flex-col sm:flex-row gap-3">
                {project.questionnaire_link && project.questionnaire_link.status === 'active' ? (
                  <>
                    <div className="relative group">
                      <div className="absolute inset-0 bg-primary/20 blur-[20px] rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                      <Input readOnly value={`${window.location.origin}#/assess/${project.questionnaire_link.token}`} className="relative bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-2xl font-mono text-xs h-12 w-full sm:w-[280px] pr-10" />
                      <Button variant="ghost" size="icon" className="absolute right-1 top-1 h-10 w-10 text-primary" onClick={copyLink}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <Button variant="outline" className="rounded-2xl border-zinc-200 dark:border-zinc-800 h-12 font-bold px-6" onClick={() => window.open(`#/assess/${project.questionnaire_link.token}`, '_blank')}>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open Link
                    </Button>
                  </>
                ) : (
                  <Button className="rounded-2xl h-12 font-bold px-8 shadow-xl shadow-primary/20" onClick={generateLink} disabled={linkLoading}>
                    {linkLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                    Generate Secure Access Link
                  </Button>
                )}
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Sidebar Intelligence */}
        <div className="space-y-8">
          {/* Assessment History */}
          <GlassCard className="flex flex-col h-full min-h-[500px]">
            <CardHeader className="pb-6">
              <div className="flex items-center justify-between mb-1">
                <CardTitle className="text-xl font-bold tracking-tight">History</CardTitle>
                <Clock className="w-4 h-4 text-muted-foreground opacity-40" />
              </div>
              <CardDescription className="text-xs">Timeline of diagnostic assessments</CardDescription>
            </CardHeader>
            <CardContent className="px-6 flex-1 overflow-auto">
              <div className="space-y-6">
                {project.assessments?.map((a, i) => (
                  <div key={a.id} className="relative group pl-8 pb-6 last:pb-0">
                    {/* Timeline Line */}
                    {i !== project.assessments.length - 1 && <div className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-zinc-100 dark:bg-zinc-800" />}
                    <div className={cn(
                      "absolute left-0 top-1 w-6 h-6 rounded-full border-4 border-white dark:border-zinc-950 flex items-center justify-center z-10 shadow-sm transition-transform group-hover:scale-110",
                      a.diagnostic_status === 'completed' ? "bg-emerald-500" : "bg-primary"
                    )} />
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Cycle #{a.assessment_number}</span>
                        <span className="text-[10px] font-bold text-muted-foreground">{a.completed_at ? new Date(a.completed_at).toLocaleDateString() : 'Active'}</span>
                      </div>
                      <div className="p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 group-hover:border-primary/20 transition-all duration-500">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-bold tracking-tight">{a.diagnostic_status === 'completed' ? 'Finalized' : 'In Progress'}</p>
                          {a.scores?.radScore && <span className="text-lg font-black text-primary">{a.scores.radScore}%</span>}
                        </div>
                        <UIStatusBadge status={a.diagnostic_status} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </GlassCard>

          {/* Quick Stats Sidebar Card */}
          <GlassCard className="p-6 bg-zinc-900 text-white border-none shadow-2xl">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
                  <Shield className="w-6 h-6 text-white stroke-[2.5px]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold uppercase tracking-widest opacity-60">Compliance</p>
                  <p className="font-bold tracking-tight">Security Verified</p>
                </div>
              </div>
              <p className="text-xs font-medium opacity-60 leading-relaxed">
                All assessment data is encrypted and isolated within your organization container.
              </p>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Archive dialog */}
      <Dialog open={showArchive} onOpenChange={setShowArchive}>
        <DialogContent className="rounded-[2rem] border-zinc-200 dark:border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold tracking-tight">Archive Project Portfolio?</DialogTitle>
            <DialogDescription className="text-base font-medium">
              This action will securely archive "{project.company_name}" from your active portfolio. Intelligence reports will remain accessible via the archive vault.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3 mt-6">
            <Button variant="outline" className="rounded-xl border-zinc-200 dark:border-zinc-800 font-bold px-6 h-11" onClick={() => setShowArchive(false)}>Cancel Action</Button>
            <Button variant="destructive" className="rounded-xl font-bold px-8 h-11 shadow-lg shadow-destructive/20" onClick={handleArchive}>Archive Now</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
  const [showPassword, setShowPassword] = useState(false)

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
          <div className="space-y-2"><Label>Password</Label><div className="relative"><Input type={showPassword ? 'text' : 'password'} value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} required className="pr-10" /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" data-testid="admin-toggle-password">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div></div>
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
              <div className="flex wrap gap-1 justify-center">
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
                      value={settings.branding?.primary_color || '#000000'} 
                      onChange={e => setSettings({...settings, branding: {...settings.branding, primary_color: e.target.value}})}
                      className="w-16 h-10 p-1 cursor-pointer"
                    />
                    <Input 
                      value={settings.branding?.primary_color || '#000000'} 
                      onChange={e => setSettings({...settings, branding: {...settings.branding, primary_color: e.target.value}})}
                      className="font-mono"
                      placeholder="#000000"
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
    toast.success('Strategic context captured successfully')
    navigate(`/projects/${id}`)
  }

  if (!loaded) return <UIPageSkeleton />
  const section = SCREENER_SECTIONS[currentSection]
  const progress = ((currentSection + 1) / SCREENER_SECTIONS.length) * 100

  return (
    <div className="relative space-y-8 bg-transparent px-2 max-w-4xl mx-auto pb-20">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none -z-10" />
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold tracking-[0.2em] uppercase text-muted-foreground/60">
          <button onClick={() => navigate('/projects')} className="hover:text-primary hover:underline cursor-pointer transition-colors">Portfolio</button>
          <ChevronRight className="w-3 h-3" />
          <button onClick={() => navigate(`/projects/${id}`)} className="hover:text-primary hover:underline cursor-pointer transition-colors">Project</button>
          <ChevronRight className="w-3 h-3" />
          <span className="text-primary font-black">Screener</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md rounded-full border border-zinc-200 dark:border-zinc-800 shadow-sm transition-all duration-500">
            {saving ? (
              <><Loader2 className="w-3.5 h-3.5 text-primary animate-spin" /><span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Syncing Intelligence...</span></>
            ) : saved ? (
              <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /><span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Intelligence Secured</span></>
            ) : (
              <><Clock className="w-3.5 h-3.5 text-muted-foreground/40" /><span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Draft Auto-Saving</span></>
            )}
          </div>
        </div>
      </div>

      <header className="space-y-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-primary font-bold tracking-[0.2em] uppercase text-[10px]">
            <FileText className="w-3 h-3" />
            Phase 01: Strategic Screener
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Capture <span className="text-primary">Business Context</span></h1>
          <p className="text-muted-foreground font-medium max-w-2xl leading-relaxed">
            Please provide accurate details about the organization&apos;s current operations to prime the RAD™ engine for deeper diagnostic analysis.
          </p>
        </div>

        <div className="pt-4 space-y-3">
          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            <span>Overall Progress</span>
            <span className="text-primary">{Math.round(progress)}% Complete</span>
          </div>
          <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden border border-zinc-200/50 dark:border-zinc-800/50 shadow-inner">
            <div className="h-full bg-primary rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(var(--primary),0.4)]" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex gap-1 pt-2 overflow-x-auto no-scrollbar">
            {SCREENER_SECTIONS.map((s, i) => (
              <div 
                key={i} 
                className={cn(
                  "h-1 flex-1 min-w-[40px] rounded-full transition-all duration-500",
                  i < currentSection ? "bg-emerald-500" : i === currentSection ? "bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]" : "bg-zinc-200 dark:bg-zinc-800"
                )}
              />
            ))}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-8">
        <GlassCard className="p-0 border-zinc-200/50 dark:border-zinc-800/50 shadow-xl overflow-visible">
          <CardHeader className="p-8 pb-4">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-sm">
                {String(currentSection + 1).padStart(2, '0')}
              </div>
              <div>
                <CardTitle className="text-2xl font-bold tracking-tight">{section.title}</CardTitle>
                <CardDescription className="font-medium">Section {currentSection + 1} of {SCREENER_SECTIONS.length}</CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-8 pt-4 space-y-10">
            {section.questions.map((q, idx) => (
              <div key={q.id} className="space-y-4 group animate-in fade-in slide-in-from-left-4 duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
                <div className="space-y-1.5">
                  <Label className="text-base font-bold tracking-tight text-zinc-800 dark:text-zinc-200 flex items-start gap-2 leading-relaxed">
                    {q.label} {q.required && <span className="text-primary font-black text-lg leading-none -mt-1">*</span>}
                  </Label>
                  {q.note && <p className="text-xs text-muted-foreground font-medium italic opacity-70 ml-0 leading-relaxed">{q.note}</p>}
                </div>

                <div className="relative">
                  {q.type === 'text' && <Input value={responses[q.id] || ''} onChange={e => updateResponse(q.id, e.target.value)} className="h-12 bg-white/50 dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800 rounded-xl focus-visible:ring-primary/20 focus-visible:border-primary transition-all duration-300 shadow-sm" />}
                  {q.type === 'email' && <Input type="email" value={responses[q.id] || ''} onChange={e => updateResponse(q.id, e.target.value)} className="h-12 bg-white/50 dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800 rounded-xl focus-visible:ring-primary/20 focus-visible:border-primary transition-all duration-300 shadow-sm" />}
                  {q.type === 'textarea' && <Textarea value={responses[q.id] || ''} onChange={e => updateResponse(q.id, e.target.value)} placeholder={q.placeholder || 'Type here...'} rows={4} className="bg-white/50 dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800 rounded-xl focus-visible:ring-primary/20 focus-visible:border-primary transition-all duration-300 shadow-sm resize-none" />}
                  
                  {q.type === 'radio' && (
                    <RadioGroup value={responses[q.id] || ''} onValueChange={v => updateResponse(q.id, v)} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {q.options.map(opt => (
                        <div key={opt} className={cn(
                          "flex items-center space-x-3 p-4 rounded-2xl border transition-all duration-300 cursor-pointer shadow-sm group/radio",
                          responses[q.id] === opt ? "bg-primary/5 border-primary shadow-primary/5" : "bg-white/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 hover:border-primary/30"
                        )} onClick={() => updateResponse(q.id, opt)}>
                          <RadioGroupItem value={opt} id={`${q.id}-${opt}`} className="border-zinc-300 dark:border-zinc-700" />
                          <Label htmlFor={`${q.id}-${opt}`} className="flex-1 cursor-pointer text-sm font-semibold tracking-tight">{opt}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  )}

                  {q.type === 'select' && (
                    <Select value={responses[q.id] || ''} onValueChange={v => updateResponse(q.id, v)}>
                      <SelectTrigger className="h-12 bg-white/50 dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-primary/20 focus:border-primary transition-all duration-300 shadow-sm font-semibold">
                        <SelectValue placeholder={`Select ${q.label.toLowerCase()}`} />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-zinc-200 dark:border-zinc-800 p-1">
                        <ScrollArea className="h-[250px]">
                          {(q.options === 'INDUSTRIES' ? INDUSTRIES : q.options === 'MONTHS' ? MONTHS : (q.options || [])).map(opt => (
                            <SelectItem key={opt} value={opt} className="rounded-xl font-medium focus:bg-primary/10 focus:text-primary transition-colors">{opt}</SelectItem>
                          ))}
                        </ScrollArea>
                      </SelectContent>
                    </Select>
                  )}

                  {q.type === 'checkbox' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {q.options.map(opt => (
                        <div key={opt} className={cn(
                          "flex items-center space-x-3 p-4 rounded-2xl border transition-all duration-300 cursor-pointer shadow-sm group/check",
                          (responses[q.id] || []).includes(opt) ? "bg-primary/5 border-primary shadow-primary/5" : "bg-white/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 hover:border-primary/30"
                        )} onClick={() => {
                          const current = responses[q.id] || []
                          const newVal = current.includes(opt) ? current.filter(v => v !== opt) : [...current, opt]
                          updateResponse(q.id, newVal)
                        }}>
                          <Checkbox id={`${q.id}-${opt}`} checked={(responses[q.id] || []).includes(opt)} className="rounded-md border-zinc-300 dark:border-zinc-700" />
                          <Label htmlFor={`${q.id}-${opt}`} className="flex-1 cursor-pointer text-sm font-semibold tracking-tight">{opt}</Label>
                        </div>
                      ))}
                    </div>
                  )}

                  {q.type === 'multiselect' && (
                    <Input 
                      value={responses[q.id] || ''} 
                      onChange={e => updateResponse(q.id, e.target.value)} 
                      placeholder="Enter details separated by commas..." 
                      className="h-12 bg-white/50 dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800 rounded-xl focus-visible:ring-primary/20 focus-visible:border-primary transition-all duration-300 shadow-sm"
                    />
                  )}

                  {q.type === 'currency' && (
                    <div className="relative group/currency">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-primary opacity-40 group-focus-within/currency:opacity-100 transition-opacity">$</div>
                      <Input 
                        type="text" 
                        value={responses[q.id] || ''} 
                        onChange={e => updateResponse(q.id, e.target.value.replace(/[^\d.,]/g, ''))} 
                        placeholder={q.placeholder || "0.00"} 
                        className="h-12 pl-10 bg-white/50 dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800 rounded-xl focus-visible:ring-primary/20 focus-visible:border-primary transition-all duration-300 shadow-sm font-mono font-bold" 
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>

          <div className="p-8 bg-zinc-50/50 dark:bg-zinc-900/50 border-t border-zinc-200/50 dark:border-zinc-800/50 rounded-b-[3rem] flex flex-col sm:flex-row justify-between gap-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setCurrentSection(Math.max(0, currentSection - 1))
                document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' })
              }} 
              disabled={currentSection === 0}
              className="rounded-2xl border-zinc-200 dark:border-zinc-800 font-bold h-12 px-8 order-2 sm:order-1"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Strategic Backtrack
            </Button>
            
            {currentSection < SCREENER_SECTIONS.length - 1 ? (
              <Button 
                onClick={() => {
                  setCurrentSection(currentSection + 1)
                  document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                className="rounded-2xl font-bold h-12 px-10 shadow-xl shadow-primary/20 order-1 sm:order-2"
              >
                Proceed to Phase {String(currentSection + 2).padStart(2, '0')}
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit} 
                className="rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12 px-10 shadow-xl shadow-emerald-500/20 order-1 sm:order-2"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Submit Strategic Intelligence
              </Button>
            )}
          </div>
        </GlassCard>
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
    await apiFetch(`/projects/${id}/diagnostic/submit`, { method: 'POST' })
    toast.success('Diagnostic intelligence finalized')
    navigate(`/projects/${id}/scores`)
  }

  if (!loaded) return <UIPageSkeleton />
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
    <div className="relative space-y-8 bg-transparent px-2 max-w-4xl mx-auto pb-20">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none -z-10" />
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold tracking-[0.2em] uppercase text-muted-foreground/60">
          <button onClick={() => navigate('/projects')} className="hover:text-primary hover:underline cursor-pointer transition-colors">Portfolio</button>
          <ChevronRight className="w-3 h-3" />
          <button onClick={() => navigate(`/projects/${id}`)} className="hover:text-primary hover:underline cursor-pointer transition-colors">Project</button>
          <ChevronRight className="w-3 h-3" />
          <span className="text-primary font-black">Diagnostic</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md rounded-full border border-zinc-200 dark:border-zinc-800 shadow-sm">
            {saving ? (
              <><Loader2 className="w-3.5 h-3.5 text-primary animate-spin" /><span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Syncing Data...</span></>
            ) : saved ? (
              <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /><span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Data Secured</span></>
            ) : (
              <><Clock className="w-3.5 h-3.5 text-muted-foreground/40" /><span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Auto-Saving</span></>
            )}
          </div>
        </div>
      </div>

      <header className="space-y-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-primary font-bold tracking-[0.2em] uppercase text-[10px]">
            <BarChart3 className="w-3 h-3" />
            Phase 02: Growth Readiness Diagnostic
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Analyze <span className="text-primary">System Maturity</span></h1>
          <p className="text-muted-foreground font-medium max-w-2xl leading-relaxed">
            Evaluate the organization across the 7 critical revenue pillars. Your objective assessment drive precise growth recommendations.
          </p>
        </div>

        <div className="pt-2 space-y-4">
          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            <span>Pillar Progression</span>
            <span className="text-primary">Pillar {currentPillar + 1} of {DIAGNOSTIC_PILLARS.length}</span>
          </div>
          <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden border border-zinc-200/50 dark:border-zinc-800/50 shadow-inner">
            <div className="h-full bg-primary rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(var(--primary),0.4)]" style={{ width: `${progress}%` }} />
          </div>
          
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-1">
            {DIAGNOSTIC_PILLARS.map((p, i) => (
              <button 
                key={p.id} 
                onClick={() => setCurrentPillar(i)}
                className={cn(
                  "flex-1 min-w-[100px] group transition-all duration-300",
                  i === currentPillar ? "opacity-100 scale-100" : "opacity-40 hover:opacity-70 scale-95"
                )}
              >
                <div className={cn(
                  "h-1.5 rounded-full mb-2 transition-all duration-500",
                  i < currentPillar ? "bg-emerald-500" : i === currentPillar ? "bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]" : "bg-zinc-200 dark:bg-zinc-800"
                )} />
                <span className={cn(
                  "text-[9px] font-black uppercase tracking-tighter block truncate",
                  i === currentPillar ? "text-primary" : "text-muted-foreground"
                )}>
                  {p.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-8">
        <GlassCard className="p-0 border-zinc-200/50 dark:border-zinc-800/50 shadow-xl overflow-visible">
          <CardHeader className="p-8 pb-4">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <Shield className="w-6 h-6 stroke-[2px]" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold tracking-tight">{pillar.name}</CardTitle>
                <CardDescription className="font-medium">Impact Weight: {Math.round(pillar.weight * 100)}%</CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-8 pt-4 space-y-12">
            {pillar.questions.map((rawQ, qi) => {
              const q = getQuestionData(rawQ)
              return (
                <div key={rawQ.id} className="space-y-6 group animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${qi * 100}ms` }}>
                  <div className="flex items-start gap-4">
                    <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-xs font-black shrink-0 border border-zinc-200/50 dark:border-zinc-700/50 group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all duration-300">
                      {qi + 1}
                    </span>
                    <div className="space-y-1.5 flex-1 pt-1">
                      <p className="text-lg font-bold tracking-tight leading-relaxed text-zinc-800 dark:text-zinc-200">{q.text}</p>
                      {q.type === 'qualitative' && <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/10 text-[9px] font-black uppercase tracking-widest px-2">Strategic Insight Required</Badge>}
                    </div>
                  </div>

                  <div className="ml-0 sm:ml-12">
                    {q.type === 'scored' && q.options && (
                      <div className="grid grid-cols-1 gap-3">
                        {q.options.map((opt, oi) => (
                          <button 
                            key={oi} 
                            disabled={isReadOnly}
                            onClick={() => updateResponse(rawQ.id, opt.s)}
                            className={cn(
                              "relative w-full text-left p-4 rounded-2xl border-2 transition-all duration-300 group/opt",
                              responses[rawQ.id] === opt.s 
                                ? "border-primary bg-primary/5 dark:bg-primary/10 shadow-lg shadow-primary/5" 
                                : "border-zinc-100 dark:border-zinc-800 bg-white/40 dark:bg-zinc-950/40 hover:border-primary/30 hover:bg-white/60 dark:hover:bg-zinc-900/60"
                            )}
                          >
                            <div className="flex items-center justify-between gap-4">
                              <span className={cn(
                                "text-sm font-semibold tracking-tight leading-snug flex-1",
                                responses[rawQ.id] === opt.s ? "text-primary font-bold" : "text-muted-foreground group-hover/opt:text-foreground"
                              )}>
                                {opt.l}
                              </span>
                              <div className={cn(
                                "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 transition-all",
                                responses[rawQ.id] === opt.s ? "bg-primary text-white scale-110" : "bg-zinc-100 dark:bg-zinc-800 text-muted-foreground"
                              )}>
                                {opt.s}
                              </div>
                            </div>
                            {responses[rawQ.id] === opt.s && (
                              <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-primary rounded-full shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                    {q.type === 'qualitative' && (
                      <div className="relative group/text">
                        <div className="absolute inset-0 bg-primary/5 blur-[20px] rounded-2xl opacity-0 group-focus-within/text:opacity-100 transition-opacity" />
                        <Textarea 
                          value={responses[rawQ.id] || ''} 
                          onChange={e => updateResponse(rawQ.id, e.target.value)} 
                          rows={5} 
                          placeholder="Provide qualitative context for this pillar..." 
                          disabled={isReadOnly} 
                          className="relative bg-white/50 dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800 rounded-2xl focus-visible:ring-primary/20 focus-visible:border-primary transition-all duration-300 shadow-sm resize-none p-5 font-medium leading-relaxed" 
                        />
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </CardContent>

          <div className="p-8 bg-zinc-50/50 dark:bg-zinc-900/50 border-t border-zinc-200/50 dark:border-zinc-800/50 rounded-b-[3rem] flex flex-col sm:flex-row justify-between gap-4">
            <Button 
              variant="outline" 
              onClick={() => {
                if (currentPillar === 0) navigate(`/projects/${id}`)
                else setCurrentPillar(currentPillar - 1)
                document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              className="rounded-2xl border-zinc-200 dark:border-zinc-800 font-bold h-12 px-8 order-2 sm:order-1"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              {currentPillar === 0 ? 'Project Portfolio' : 'Previous Pillar'}
            </Button>
            
            {currentPillar < DIAGNOSTIC_PILLARS.length - 1 ? (
              <Button 
                onClick={() => {
                  setCurrentPillar(currentPillar + 1)
                  document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                className="rounded-2xl font-bold h-12 px-10 shadow-xl shadow-primary/20 order-1 sm:order-2"
              >
                Analyze Next Pillar
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : !isReadOnly ? (
              <Button 
                onClick={handleSubmit} 
                className="rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-12 px-10 shadow-xl shadow-primary/30 order-1 sm:order-2 animate-pulse hover:animate-none"
              >
                <Zap className="w-4 h-4 mr-2" />
                Finalize Diagnostic Intelligence
              </Button>
            ) : null}
          </div>
        </GlassCard>
      </div>
    </div>
  )
}

// ===== SCORES PAGE =====
function ScoresPage({ id }) {
  const { navigate } = useAuth()
  const { data: scores, isLoading: scoresLoading } = useQuery({ queryKey: ['scores', id], queryFn: () => apiFetch(`/projects/${id}/scores`) })
  const { data: project, isLoading: projectLoading } = useQuery({ queryKey: ['project', id], queryFn: () => apiFetch(`/projects/${id}`) })
  const [downloadingPdf, setDownloadingPdf] = useState(false)

  async function downloadPdf() {
    setDownloadingPdf(true)
    try {
      let reportData = null
      try {
        reportData = await apiFetch(`/projects/${id}/report`)
      } catch (e) {
        // No report exists yet — generate it via AI
        toast.info('Generating AI Intelligence Report... this may take up to 60 seconds.')
        reportData = await apiFetch(`/projects/${id}/report/generate`, { method: 'POST' })
      }
      await generateClientPdf({
        scores,
        report: reportData,
        project,
        screenerResponses: reportData?.screener_responses || {},
      })
      toast.success('Executive PDF Exported')
    } catch (err) {
      toast.error('Report generation failed: ' + (err.message || 'Unknown error'))
    } finally {
      setDownloadingPdf(false)
    }
  }

  if (scoresLoading || projectLoading) return <UIPageSkeleton />
  if (!scores) return <div className="text-center py-24"><GlassCard className="p-12 max-w-md mx-auto"><AlertTriangle className="w-12 h-12 text-muted-foreground opacity-20 mx-auto mb-4" /><p className="text-muted-foreground font-medium">Intelligence data not finalized</p><Button variant="ghost" className="mt-4" onClick={() => navigate(`/projects/${id}`)}>Return to Project</Button></GlassCard></div>

  const maturityBand = getMaturityBand(scores.radScore)
  const bandClasses = maturityBand.includes('Strong') ? 'bg-band-strong shadow-band-strong/20' : maturityBand.includes('Constrained') ? 'bg-band-constrained shadow-band-constrained/20' : maturityBand.includes('Underpowered') ? 'bg-band-underpowered shadow-band-underpowered/20' : 'bg-band-risk shadow-band-risk/20'
  const bandColor = (score) => score >= 80 ? 'bg-band-strong' : score >= 65 ? 'bg-band-constrained' : score >= 50 ? 'bg-band-underpowered' : 'bg-band-risk'

  const CustomRadarTick = ({ payload, x, y, cx, cy, ...rest }) => {
    const label = payload.value || ''
    const words = label.split(' ')
    const lines = []
    let current = ''
    for (const word of words) {
      if (current && (current + ' ' + word).length > 18) {
        lines.push(current)
        current = word
      } else {
        current = current ? current + ' ' + word : word
      }
    }
    if (current) lines.push(current)
    const dx = x - cx
    const dy = y - cy
    const anchor = Math.abs(dx) < 5 ? 'middle' : dx > 0 ? 'start' : 'end'
    const offsetY = dy < -5 ? -4 : dy > 5 ? 8 : 0
    return (
      <text x={x} y={y + offsetY} textAnchor={anchor} fill="currentColor" className="text-muted-foreground" fontSize={9} fontWeight={700}>
        {lines.map((line, i) => (
          <tspan key={i} x={x} dy={i === 0 ? 0 : 12}>{line}</tspan>
        ))}
      </text>
    )
  }
  
  const radarData = Object.entries(scores.pillarScores || {}).map(([pid, data]) => ({
    pillar: PILLAR_NAMES[pid] || pid,
    fullName: pillarLabel(pid),
    score: data.score,
    fullMark: 100
  }))

  const trendData = (project?.assessments || []).filter(a => a.scores).map(a => ({
    name: `#${a.assessment_number}`,
    radScore: a.scores?.radScore || 0,
    raps: a.scores?.raps?.score || 0,
    date: a.completed_at ? new Date(a.completed_at).toLocaleDateString() : ''
  })).reverse()

  return (
    <div className="relative space-y-8 bg-transparent px-2 max-w-6xl mx-auto pb-20">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none -z-10" />
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-bold tracking-[0.2em] uppercase text-muted-foreground/60">
          <button onClick={() => navigate('/projects')} className="hover:text-primary hover:underline cursor-pointer transition-colors">Portfolio</button>
          <ChevronRight className="w-3 h-3" />
          <button onClick={() => navigate(`/projects/${id}`)} className="hover:text-primary hover:underline cursor-pointer transition-colors">Project</button>
          <ChevronRight className="w-3 h-3" />
          <span className="text-primary font-black">Intelligence</span>
        </div>
        
        <Button className="rounded-2xl font-bold h-10 px-6 shadow-lg shadow-primary/20" onClick={downloadPdf} disabled={downloadingPdf}>
          {downloadingPdf ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
          Generate Report
        </Button>
      </div>

      <header className="space-y-1.5">
        <div className="flex items-center gap-2 text-primary font-bold tracking-[0.2em] uppercase text-[10px]">
          <LayoutDashboard className="w-3 h-3" />
          Revenue Acceleration Intelligence
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">{project?.company_name && <span className="text-zinc-900 dark:text-zinc-50">{project.company_name}</span>}<span className="text-primary">Strategic Performance Analysis</span></h1>
        <p className="text-muted-foreground font-medium max-w-2xl leading-relaxed">
          Comprehensive diagnostic output for <span className="text-foreground font-bold">{project?.company_name}</span>. Review system maturity and primary constraints.
        </p>
      </header>

      {/* Main Intelligence Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* RAD Score Focus */}
        <GlassCard className="p-10 lg:col-span-1 flex flex-col items-center justify-center text-center relative overflow-hidden border-primary/10">
          <div className="relative z-10 space-y-6">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">System Maturity Score</p>
              <div className="text-8xl font-black tracking-tighter text-primary animate-in zoom-in duration-700">{scores.radScore}%</div>
            </div>
            
            <div className="space-y-4">
              <Badge className={cn("text-white font-black px-6 py-2 rounded-full text-sm tracking-wider shadow-lg", bandClasses)}>
                {maturityBand.toUpperCase()}
              </Badge>
              
              {(() => {
                const constraints = Object.entries(scores.pillarScores || {}).filter(([, d]) => d.score < 50)
                const names = constraints.length > 0
                  ? constraints.map(([pid]) => pillarLabel(pid))
                  : scores.primaryConstraint ? [scores.primaryConstraint.id ? pillarLabel(scores.primaryConstraint.id) : scores.primaryConstraint.name] : []
                return names.length > 0 && (
                  <div className="p-5 rounded-[2rem] bg-band-risk/5 border border-band-risk/10 backdrop-blur-sm text-left">
                    <p className="text-[9px] font-black uppercase tracking-widest text-band-risk mb-2">{names.length > 1 ? 'Primary Constraints' : 'Primary Constraint'}</p>
                    <ul className="space-y-1">
                    {names.map((name, i) => (
                      <li key={i} className="text-lg font-bold tracking-tight text-band-risk flex items-start gap-2"><span className="mt-2.5 w-1.5 h-1.5 rounded-full bg-band-risk shrink-0" />{name}</li>
                    ))}
                    </ul>
                  </div>
                )
              })()}
            </div>
          </div>
          
          {/* Progress ring background */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] dark:opacity-[0.05] pointer-events-none">
            <Zap className="w-64 h-64 text-primary" />
          </div>
        </GlassCard>

        {/* Pillar Visualization */}
        <GlassCard className="lg:col-span-2 p-8 border-zinc-200/50 dark:border-zinc-800/50">
          <div className="flex items-center justify-between mb-8">
            <div className="space-y-1">
              <h3 className="text-xl font-bold tracking-tight">Pillar Breakdown</h3>
              <p className="text-xs text-muted-foreground font-medium">Performance across all growth dimensions</p>
            </div>
            <div className="flex gap-1.5">
              {['bg-band-strong', 'bg-band-constrained', 'bg-band-underpowered', 'bg-band-risk'].map((c) => (
                <div key={c} className={cn("w-2 h-2 rounded-full", c)} />
              ))}
            </div>
          </div>
          
          <div className="h-[420px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} margin={{ top: 30, right: 80, bottom: 30, left: 80 }}>
                <PolarGrid stroke="currentColor" className="text-zinc-200 dark:text-zinc-800" />
                <PolarAngleAxis dataKey="pillar" tick={<CustomRadarTick />} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="Score" dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} strokeWidth={3} />
                <RechartsTooltip content={({ payload }) => payload?.[0] ? (
                  <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 p-3 rounded-2xl shadow-2xl">
                    <p className="font-bold text-xs uppercase tracking-wider mb-1 text-muted-foreground">{payload[0].payload.fullName}</p>
                    <p className="text-2xl font-black text-primary">{payload[0].value}</p>
                  </div>
                ) : null} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      {/* RAPS & Detailed Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <GlassCard className="p-8 border-zinc-200/50 dark:border-zinc-800/50">
          <div className="flex items-center justify-between mb-8">
            <div className="space-y-1">
              <h3 className="text-xl font-bold tracking-tight">Pillar Scores</h3>
              <p className="text-xs text-muted-foreground font-medium">Granular maturity analysis</p>
            </div>
            <Target className="w-5 h-5 text-primary opacity-20" />
          </div>
          
          <div className="space-y-4">
            {Object.entries(scores.pillarScores || {}).map(([pid, data]) => {
              const isPrimary = data.score < 50
              return (
                <div key={pid} className={cn(
                  "p-4 rounded-2xl border transition-all duration-500",
                  isPrimary ? "bg-band-risk/5 border-band-risk/20 shadow-lg shadow-band-risk/5" : "bg-white/40 dark:bg-zinc-950/40 border-zinc-100 dark:border-zinc-800"
                )}>
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-2.5 h-2.5 rounded-full shadow-sm", bandColor(data.score))} />
                      <span className={cn("text-sm font-bold tracking-tight", isPrimary ? "text-band-risk" : "text-zinc-700 dark:text-zinc-300")}>
                        {pillarLabel(pid)}
                      </span>
                    </div>
                    <span className="text-sm font-black tabular-nums">{data.score}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800/50 rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full transition-all duration-1000 ease-out", bandColor(data.score))} style={{ width: `${data.score}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </GlassCard>

        <div className="space-y-8">
          {scores.raps && (
            <GlassCard className="p-8 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-none shadow-2xl relative overflow-hidden group">
              <div className="relative z-10 flex flex-col h-full justify-between gap-8">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold tracking-tight opacity-100">Revenue Probability</h3>
                    <p className="text-xs font-bold uppercase tracking-widest opacity-50">RAPS Intelligence</p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30 rotate-3 group-hover:rotate-0 transition-transform duration-500">
                    <Target className="w-6 h-6 text-white stroke-[2.5px]" />
                  </div>
                </div>
                
                <div className="flex items-baseline gap-2">
                  <span className="text-7xl font-black tracking-tighter">{scores.raps.score}%</span>
                  <span className="text-xs font-bold uppercase tracking-widest opacity-50 mb-3">Confidence</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-white/5 dark:bg-zinc-100 border border-white/10 dark:border-zinc-200">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1 text-white">Target</p>
                    <p className="text-lg font-bold tabular-nums tracking-tight">${(scores.raps.revenueTarget || 0).toLocaleString()}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 dark:bg-zinc-100 border border-white/10 dark:border-zinc-200">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1 text-white">Invoiced</p>
                    <p className="text-lg font-bold tabular-nums tracking-tight">${(scores.raps.revenueInvoiced || 0).toLocaleString()}</p>
                  </div>
                </div>
              </div>
              
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary/10 blur-[60px] rounded-full group-hover:scale-150 transition-transform duration-1000" />
            </GlassCard>
          )}

        </div>
      </div>

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
              {currentPillar < DIAGNOSTIC_PILLARS.length - 1 ? <Button onClick={() => { setCurrentPillar(currentPillar + 1); document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' }) }}>Next Pillar</Button> : <Button onClick={handleFinalSubmit} className="bg-green-600 hover:bg-green-700"><CheckCircle2 className="w-4 h-4 mr-2" />Submit Assessment</Button>}
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
        const currentHash = window.location.hash.slice(1)
        if (currentHash === '/login' || currentHash === '' || !currentHash) navigate('/dashboard')
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
  if (hash === '/signup' && !user && !demoActive) return <SignupPage onSuccess={checkAuth} onDemo={enterDemoMode} />
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
