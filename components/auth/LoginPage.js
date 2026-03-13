'use client'
import { useState } from 'react'
import { useAuth } from '@/components/shared/context'
import { toast } from 'sonner'
import { Zap, Mail, ArrowLeft, Loader2, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function LoginPage({ onSuccess, onDemo }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    try {
      // Demo mode simulation
      await new Promise(r => setTimeout(r, 800))
      toast.success('Welcome back!')
      onSuccess?.()
    } catch (err) {
      toast.error(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  if (showForgotPassword) {
    return <ForgotPasswordPage onBack={() => setShowForgotPassword(false)} />
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative bg-white">
      <Card className="w-full max-w-md border-2 relative z-10 bg-background">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto">
            <img src="/logo.jpeg" alt="Biz Ascend" className="h-16 object-contain" />
          </div>
          <div>
            <CardDescription>Revenue Acceleration Diagnostic (RAD)</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" data-testid="login-email-input" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <button type="button" onClick={() => setShowForgotPassword(true)} className="text-xs text-primary hover:underline" data-testid="forgot-password-link">
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="pr-10" data-testid="login-password-input" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" data-testid="login-toggle-password">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading} data-testid="login-submit-btn">
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Signing in...</> : 'Sign In'}
            </Button>
          </form>
          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Or</span></div>
          </div>
          <Button variant="outline" className="w-full" onClick={onDemo} data-testid="explore-demo-btn">
            <Zap className="w-4 h-4 mr-2" />Explore Demo
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export function ForgotPasswordPage({ onBack }) {
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
      // Mock password reset flow
      await new Promise(r => setTimeout(r, 1500))
      setSent(true)
      toast.success('Reset link sent! Check your email.')
    } catch (err) {
      toast.error(err.message || 'Failed to send reset link')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative bg-white">
      <Card className="w-full max-w-md border-2 relative z-10 bg-background">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl">Reset Password</CardTitle>
            <CardDescription>
              {sent ? "Check your inbox for the reset link" : "Enter your email to receive a reset link"}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {sent ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-center">
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
                  data-testid="forgot-email-input"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading} data-testid="forgot-submit-btn">
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
  )
}
