import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Clock,
  RotateCw,
  ArrowLeft,
  Info,
} from 'lucide-react'
import { useApp } from '@/app/context'
import { Button } from '@/components/ui/Button'
import { InternSyncLogo } from '@/components/brand/InternSyncLogo'

export const SignupPage: React.FC = () => {
  const navigate = useNavigate()
  const { signup, resendVerificationEmail, enterDemoMode, isSupabaseConfigured } = useApp()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [verificationSent, setVerificationSent] = useState(false)

  // Resend state & cooldown timer
  const [resendCooldown, setResendCooldown] = useState(0)
  const [isResending, setIsResending] = useState(false)
  const [resendMessage, setResendMessage] = useState('')
  const [resendError, setResendError] = useState('')

  // Handle countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [resendCooldown])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim() || !email.trim()) {
      setError('Please provide your name and email.')
      return
    }
    if (!password || password.length < 6) {
      setError('Password should be at least 6 characters.')
      return
    }

    setError('')
    setIsLoading(true)

    try {
      const res = await signup(fullName.trim(), email.trim(), password)
      if (res.requiresVerification) {
        setVerificationSent(true)
        setResendCooldown(60) // Start 60s cooldown for resending
      } else {
        // Immediate session without confirmation required
        navigate('/onboarding')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Account creation failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    if (resendCooldown > 0 || isResending || !email.trim()) return

    setIsResending(true)
    setResendError('')
    setResendMessage('')

    try {
      const result = await resendVerificationEmail(email.trim())
      setResendMessage(result.message)
      setResendCooldown(60)
    } catch (err: unknown) {
      setResendError(
        err instanceof Error ? err.message : 'Failed to resend verification email. Please try again later.'
      )
    } finally {
      setIsResending(false)
    }
  }

  const handleEnterDemo = () => {
    enterDemoMode()
    navigate('/dashboard')
  }

  // --- VERIFICATION PENDING SCREEN ---
  if (verificationSent) {
    return (
      <div className="min-h-screen bg-[#fafbfc] flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-indigo-100 selection:text-indigo-900">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
          <div className="flex justify-center mb-6">
            <InternSyncLogo variant="full" size="lg" to="/" />
          </div>
        </div>

        <div className="mt-4 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
          <div className="bg-white py-8 px-6 sm:px-8 shadow-xl shadow-slate-200/50 rounded-3xl border border-slate-200/80 space-y-6">
            <div className="text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto shadow-2xs">
                <Mail className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Check your inbox</h2>
              <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
                We sent a secure verification link to <strong className="text-slate-900 font-semibold">{email}</strong>.
              </p>
            </div>

            {/* Step-by-Step Instructions */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-3 text-xs">
              <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-indigo-600" />
                <span>Next steps to activate your account:</span>
              </div>
              <ul className="space-y-2 text-slate-600 pl-4 list-decimal marker:text-indigo-600 marker:font-semibold">
                <li>Open the confirmation email sent to <span className="font-medium text-slate-800">{email}</span>.</li>
                <li>Check your <strong>Spam</strong> or <strong>Promotions</strong> folder if it doesn’t arrive within 2 minutes.</li>
                <li>Click the <strong>Confirm Email</strong> link to activate your student account.</li>
                <li>Return here to sign in and immediately access your Career DNA and opportunity dashboard.</li>
              </ul>
            </div>

            {/* Resend Status / Alerts */}
            {resendMessage && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-800 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{resendMessage}</span>
              </div>
            )}

            {resendError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{resendError}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3 pt-1">
              <Button
                onClick={() => navigate('/login')}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs py-2.5 rounded-xl font-semibold shadow-xs"
              >
                Proceed to Log In
              </Button>

              <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setVerificationSent(false)}
                  className="flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Edit details / wrong email</span>
                </button>

                <button
                  type="button"
                  disabled={resendCooldown > 0 || isResending}
                  onClick={handleResend}
                  className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors cursor-pointer"
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
                      <span>Resend verification email</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const isDuplicateError = error.toLowerCase().includes('already exists') || error.toLowerCase().includes('already registered')
  const isRateLimitError = error.toLowerCase().includes('rate limit')

  return (
    <div className="min-h-screen bg-[#fafbfc] flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-indigo-100 selection:text-indigo-900">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center mb-6">
          <InternSyncLogo variant="full" size="lg" to="/" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Build your Career DNA.
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Upload your real evidence and uncover opportunities you actually qualify for.
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

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700 space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>

              {isDuplicateError && (
                <div className="pt-1 border-t border-rose-200/60">
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-1 font-semibold text-indigo-700 hover:text-indigo-900 text-xs underline"
                  >
                    <span>Click here to sign in to your existing account</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}

              {isRateLimitError && (
                <div className="pt-1 border-t border-rose-200/60 text-[11px] text-rose-800 leading-normal">
                  <span>
                    The authentication server limits verification email dispatch to protect user security. You can wait 2–3 minutes and retry, or explore the full platform immediately via Demo Mode below.
                  </span>
                </div>
              )}
            </div>
          )}

          <form noValidate onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Full name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Chen"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  placeholder="alex@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Create password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="At least 6 characters"
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
              <span>{isLoading ? 'Creating account...' : 'Create account'}</span>
              <ArrowRight className="w-4 h-4 ml-2" />
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
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-700">
              Sign in
            </Link>
          </div>
        </div>

        {/* Minimal Footer */}
        <p className="mt-8 text-center text-[11px] text-slate-400">
          By signing up, you agree to InternSync's terms and privacy standards.
        </p>
      </div>
    </div>
  )
}
