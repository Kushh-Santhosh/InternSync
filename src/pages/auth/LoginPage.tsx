import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  RotateCw,
  Clock,
  ArrowRight,
  Info,
} from 'lucide-react'
import { useApp } from '@/app/context'
import { Button } from '@/components/ui/Button'
import { InternSyncLogo } from '@/components/brand/InternSyncLogo'

export const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, resendVerificationEmail, enterDemoMode, isSupabaseConfigured } = useApp()

  const [email, setEmail] = useState(() => (location.state as any)?.prefillEmail || '')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Resend verification state
  const [showResend, setShowResend] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [isResending, setIsResending] = useState(false)
  const [resendStatus, setResendStatus] = useState('')

  // Determine redirect destination after login
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard'

  // Handle countdown timer for resend
  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [resendCooldown])

  // Parse hash and search parameters for expired or confirmed tokens
  useEffect(() => {
    const hash = window.location.hash || ''
    const search = window.location.search || ''

    if (hash.includes('error_code=otp_expired') || hash.includes('otp_expired') || search.includes('otp_expired')) {
      setError('Your verification link has expired or is invalid. Please request a new verification link below.')
      setShowResend(true)
    } else if (hash.includes('error_description')) {
      const match = hash.match(/error_description=([^&]+)/)
      const desc = match ? decodeURIComponent(match[1].replace(/\+/g, ' ')) : 'Authentication link is invalid or expired.'
      setError(desc)
      setShowResend(true)
    } else if (hash.includes('access_token') && (hash.includes('type=signup') || hash.includes('type=invite') || hash.includes('type=recovery'))) {
      setSuccessMessage('Email verified successfully! You are now logged in.')
      setTimeout(() => {
        navigate('/dashboard', { replace: true })
      }, 1500)
    }
  }, [navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) {
      setError('Please enter your email address.')
      return
    }
    if (!password) {
      setError('Please enter your password.')
      return
    }
    setError('')
    setIsLoading(true)

    try {
      await login(email.trim(), password)
      navigate(from, { replace: true })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to sign in. Please verify your credentials.'
      setError(msg)
      // If error might be due to unconfirmed email, allow quick resend
      if (msg.toLowerCase().includes('not confirmed') || msg.toLowerCase().includes('credentials')) {
        setShowResend(true)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    if (resendCooldown > 0 || isResending || !email.trim()) return

    setIsResending(true)
    setResendStatus('')

    try {
      const result = await resendVerificationEmail(email.trim())
      setResendStatus(result.message)
      setResendCooldown(60)
    } catch (err: unknown) {
      setResendStatus(
        err instanceof Error ? err.message : 'Could not send verification email. Please try again later.'
      )
    } finally {
      setIsResending(false)
    }
  }

  const handleEnterDemo = () => {
    enterDemoMode()
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#fafbfc] flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-indigo-100 selection:text-indigo-900">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center mb-6">
          <InternSyncLogo variant="full" size="lg" to="/" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Sign in to InternSync
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Access your evidence-based Career DNA and live opportunity fit.
        </p>
      </div>

      {/* Main Card */}
      <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl shadow-slate-200/50 rounded-3xl border border-slate-200/80">
          {!isSupabaseConfigured && (
            <div className="mb-5 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Supabase Auth Not Configured</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                To create real accounts, provide <code className="font-mono bg-amber-100 px-1 py-0.5 rounded">VITE_SUPABASE_URL</code> and <code className="font-mono bg-amber-100 px-1 py-0.5 rounded">VITE_SUPABASE_ANON_KEY</code> in your environment. You can explore the full application using Demo Mode.
              </p>
            </div>
          )}

          {successMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-800 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700 space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
              {showResend && email.trim() && (
                <div className="pt-2 border-t border-rose-200/60 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-rose-800 font-normal">Need a fresh confirmation link?</span>
                  <button
                    type="button"
                    disabled={resendCooldown > 0 || isResending}
                    onClick={handleResend}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 hover:text-indigo-900 disabled:text-slate-400 cursor-pointer"
                  >
                    {isResending ? (
                      <>
                        <RotateCw className="w-3 h-3 animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : resendCooldown > 0 ? (
                      <>
                        <Clock className="w-3 h-3" />
                        <span>Resend in {resendCooldown}s</span>
                      </>
                    ) : (
                      <>
                        <RotateCw className="w-3 h-3" />
                        <span>Resend link</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {resendStatus && (
            <div className="mb-5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-start gap-2">
              <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <span>{resendStatus}</span>
            </div>
          )}

          <form noValidate onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  placeholder="name@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">Password</label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-xl shadow-md shadow-indigo-600/20 transition-all mt-2 cursor-pointer"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          {/* Explicit Demo Mode Option */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-slate-400 font-medium">or test with demo</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleEnterDemo}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 hover:border-indigo-300 bg-slate-50 hover:bg-indigo-50/50 text-xs font-semibold text-slate-700 hover:text-indigo-700 transition-all cursor-pointer shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Explore Interactive Demo Mode (Rahul Sharma)</span>
          </button>

          <div className="mt-7 text-center text-xs text-slate-500">
            Don't have an account?{' '}
            <Link to="/signup" className="font-semibold text-indigo-600 hover:text-indigo-700">
              Sign up
            </Link>
          </div>
        </div>

        {/* Minimal Footer */}
        <p className="mt-8 text-center text-[11px] text-slate-400">
          By signing in, you agree to InternSync's terms and privacy standards.
        </p>
      </div>
    </div>
  )
}
