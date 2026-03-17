'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Loader2, Eye, EyeOff, KeyRound, CheckCircle2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSessionReady(true)
        setChecking(false)
      }
    })

    // Also check if there's already a session (user may have already been redirected)
    const timer = setTimeout(() => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          setSessionReady(true)
        }
        setChecking(false)
      })
    }, 1000)

    return () => {
      subscription?.unsubscribe()
      clearTimeout(timer)
    }
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) throw updateError
      await supabase.auth.signOut()
      setSuccess(true)
      toast.success('Password updated successfully!')
    } catch (err) {
      setError(err.message || 'Failed to update password')
      toast.error(err.message || 'Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-white">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-gray-500">Verifying reset link...</p>
        </div>
      </div>
    )
  }

  if (!sessionReady) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-white">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center">
              <KeyRound className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Invalid or Expired Link</h1>
            <p className="text-gray-500">This password reset link is invalid or has expired. Please request a new one.</p>
          </div>
          <Card className="border border-gray-200 bg-white shadow-2xl shadow-black/20">
            <CardContent className="pt-6">
              <Button
                className="w-full h-11"
                onClick={() => window.location.href = '/#/login'}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />Back to Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-white">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Password Updated</h1>
            <p className="text-gray-500">Your password has been reset successfully. You can now sign in with your new password.</p>
          </div>
          <Card className="border border-gray-200 bg-white shadow-2xl shadow-black/20">
            <CardContent className="pt-6">
              <Button
                className="w-full h-11 bg-primary hover:bg-primary/90 text-white"
                onClick={() => window.location.href = '/#/login'}
              >
                Go to Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-white">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/25">
            <KeyRound className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Set New Password</h1>
          <p className="text-gray-500">Enter your new password below</p>
        </div>
        <Card className="border border-gray-200 bg-white shadow-2xl shadow-black/20">
          <CardContent className="pt-6 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password" className="text-gray-700 font-medium">New Password</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    required
                    className="h-11 pr-10 bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-primary focus:ring-primary"
                    data-testid="reset-password-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-gray-700 font-medium">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    required
                    className="h-11 pr-10 bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-primary focus:ring-primary"
                    data-testid="reset-confirm-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-center">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
              <Button
                type="submit"
                className="w-full h-11 bg-primary hover:bg-primary/90 text-white"
                disabled={loading}
                data-testid="reset-submit-btn"
              >
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Updating...</> : 'Update Password'}
              </Button>
            </form>
            <Button
              variant="ghost"
              className="w-full text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              onClick={() => window.location.href = '/#/login'}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
