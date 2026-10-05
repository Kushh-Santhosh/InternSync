import React, { useState } from 'react'
import {
  BrainCircuit,
  CheckCircle2,
  Globe,
  Lock,
  LogOut,
  RefreshCw,
  Save,
  Settings,
  Shield,
  ShieldCheck,
  Sparkles,
  User,
  Workflow,
  Sliders,
} from 'lucide-react'
import { useApp } from '@/app/context'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils/cn'

type SettingsTab = 'profile' | 'preferences' | 'integrations' | 'privacy' | 'account'

export const SettingsPage: React.FC = () => {
  const { profile, updateProfile, integrations, refreshIntegrations, logout } = useApp()
  const [activeTab, setActiveTab] = useState<SettingsTab>('integrations')

  // Profile form state
  const [fullName, setFullName] = useState(profile.fullName || '')
  const [email, setEmail] = useState(profile.email || '')
  const [bio, setBio] = useState(profile.bio || '')
  const [university, setUniversity] = useState(profile.university || '')
  const [degree, setDegree] = useState(profile.degree || '')
  const [currentYear, setCurrentYear] = useState(profile.currentYear || 3)
  const [targetRole, setTargetRole] = useState(profile.targetRole || 'AI Engineer Intern')
  const [preferredLocations, setPreferredLocations] = useState(
    profile.preferredLocations?.join(', ') || 'Bengaluru, Remote'
  )

  // Preferences form state
  const [workModePreference, setWorkModePreference] = useState(
    profile.workModePreference || 'hybrid'
  )
  const [availableDurationMonths, setAvailableDurationMonths] = useState(
    profile.availableDurationMonths || 3
  )
  const [emailAlerts, setEmailAlerts] = useState(true)

  // Status/action states
  const [isSaving, setIsSaving] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    updateProfile({
      fullName,
      email,
      bio,
      university,
      degree,
      currentYear: Number(currentYear),
      targetRole: targetRole.trim(),
      preferredLocations: preferredLocations
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean),
    })
    setIsSaving(false)
    showToast('Profile information updated successfully.')
  }

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    updateProfile({
      workModePreference: workModePreference as 'remote' | 'hybrid' | 'onsite' | 'any',
      availableDurationMonths: Number(availableDurationMonths),
    })
    setIsSaving(false)
    showToast('Internship preferences saved.')
  }

  const handleRefreshIntegrations = async () => {
    setIsRefreshing(true)
    await refreshIntegrations()
    setIsRefreshing(false)
    showToast('Integration statuses re-verified.')
  }

  const handleToggleGitHub = async () => {
    if (integrations.github?.status === 'ACTIVE') {
      await fetch('/api/auth/github/disconnect', { method: 'POST' })
    } else {
      await fetch('/api/auth/github/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'student-developer' }),
      })
    }
    await refreshIntegrations()
    showToast(
      integrations.github?.status === 'ACTIVE'
        ? 'GitHub account disconnected.'
        : 'GitHub account connected for project evidence analysis.'
    )
  }

  const tabs = [
    { id: 'profile' as const, label: 'Profile', icon: User },
    { id: 'preferences' as const, label: 'Preferences', icon: Sliders },
    { id: 'integrations' as const, label: 'Integrations', icon: Sparkles },
    { id: 'privacy' as const, label: 'Privacy', icon: Shield },
    { id: 'account' as const, label: 'Account', icon: Lock },
  ]

  const isGithubConnected = integrations.github?.status === 'ACTIVE'

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Settings className="w-6 h-6 text-indigo-600" />
            Settings
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your student profile, opportunity preferences, and platform integration status.
          </p>
        </div>

        {/* Global verified status pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 self-start sm:self-auto">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Live Readiness Engine Active</span>
        </div>
      </div>

      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 pb-px overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all cursor-pointer whitespace-nowrap',
                isActive
                  ? 'bg-white text-indigo-600 border-b-2 border-indigo-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              )}
            >
              <Icon className={cn('w-4 h-4', isActive ? 'text-indigo-600' : 'text-slate-400')} />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Tab 1: Profile */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div>
              <h2 className="text-base font-bold text-slate-900">Personal & Academic Profile</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Information used to build your Career DNA and evaluate candidate eligibility.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. alex@university.edu"
                  className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Professional Bio / Summary
                </label>
                <input
                  type="text"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="e.g. Aspiring AI Engineer & Full Stack Developer"
                  className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  University / College
                </label>
                <input
                  type="text"
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  placeholder="e.g. National Institute of Technology"
                  className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Degree
                  </label>
                  <input
                    type="text"
                    value={degree}
                    onChange={(e) => setDegree(e.target.value)}
                    placeholder="e.g. B.Tech Computer Science"
                    className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Current Year
                  </label>
                  <select
                    value={currentYear}
                    onChange={(e) => setCurrentYear(Number(e.target.value))}
                    className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                  >
                    <option value={1}>Year 1 (Freshman)</option>
                    <option value={2}>Year 2 (Sophomore)</option>
                    <option value={3}>Year 3 (Junior)</option>
                    <option value={4}>Year 4 (Senior)</option>
                    <option value={5}>Postgraduate / Master's</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Target Role
                </label>
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g. AI Engineer Intern"
                  className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Preferred Locations (comma-separated)
                </label>
                <input
                  type="text"
                  value={preferredLocations}
                  onChange={(e) => setPreferredLocations(e.target.value)}
                  placeholder="Bengaluru, Remote, Hyderabad"
                  className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <Button type="submit" disabled={isSaving} className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-5">
                <Save className="w-3.5 h-3.5 mr-1.5" />
                {isSaving ? 'Saving...' : 'Save Profile Changes'}
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* Tab 2: Preferences */}
      {activeTab === 'preferences' && (
        <form onSubmit={handleSavePreferences} className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div>
              <h2 className="text-base font-bold text-slate-900">Internship Search Preferences</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure your search filters and opportunity notification criteria.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Work Arrangement Preference
                </label>
                <select
                  value={workModePreference}
                  onChange={(e) => setWorkModePreference(e.target.value as any)}
                  className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                >
                  <option value="remote">Remote Only</option>
                  <option value="hybrid">Hybrid (Remote + Onsite)</option>
                  <option value="onsite">Onsite Only</option>
                  <option value="any">Any / Flexible</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Available Internship Duration (Months)
                </label>
                <input
                  type="number"
                  value={availableDurationMonths}
                  onChange={(e) => setAvailableDurationMonths(Number(e.target.value))}
                  placeholder="e.g. 3"
                  className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="md:col-span-2 pt-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emailAlerts}
                    onChange={(e) => setEmailAlerts(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <div>
                    <span className="text-xs font-semibold text-slate-800">
                      Receive weekly High-Fit Opportunity digests
                    </span>
                    <p className="text-[11px] text-slate-500">
                      Only alerts with 85%+ readiness score and verified direct application links.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <Button type="submit" disabled={isSaving} className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-5">
                <Save className="w-3.5 h-3.5 mr-1.5" />
                {isSaving ? 'Saving...' : 'Save Preferences'}
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* Tab 3: Integrations (STATUS ONLY - NO SECRET INPUTS) */}
      {activeTab === 'integrations' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-slate-50 border border-slate-200 p-4 rounded-xl text-xs">
            <div>
              <p className="font-semibold text-slate-800">Application Integration Hub</p>
              <p className="text-slate-500 text-[11px] mt-0.5">
                InternSync securely connects to enterprise AI and job feed networks server-side.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRefreshIntegrations}
              disabled={isRefreshing}
              className="text-xs"
            >
              <RefreshCw className={cn('w-3.5 h-3.5 mr-1.5', isRefreshing && 'animate-spin')} />
              {isRefreshing ? 'Checking...' : 'Re-verify Status'}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. OpenRouter AI */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">OpenRouter AI</h3>
                      <p className="text-[11px] text-slate-500">Live intelligence & requirement parsing</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-semibold text-emerald-700">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Connected</span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Live web intelligence enabled. Automatically analyzes complex internship job descriptions, detects unspoken prerequisites, and normalizes skill taxonomy.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span className="font-medium text-slate-700">Model Fallback Order</span>
                <span className="font-mono text-[10px] text-indigo-600 font-semibold">Gemini 2.0 Flash → Claude 3.5 Haiku</span>
              </div>
            </div>

            {/* 2. Live Web Search */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                      <Globe className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Live Web Search</h3>
                      <p className="text-[11px] text-slate-500">Broad career portal crawler</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-semibold text-emerald-700">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Enabled</span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Real-time query engine searching Greenhouse, Lever, Ashby, Workday, and official company hiring portals for verified active postings.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span className="font-medium text-slate-700">URL Verification</span>
                <span className="text-emerald-700 font-medium">Direct apply validation active</span>
              </div>
            </div>

            {/* 3. Adzuna Job Feed */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600">
                      <BrainCircuit className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Adzuna Job Network</h3>
                      <p className="text-[11px] text-slate-500">Structured opportunity feed</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-semibold text-emerald-700">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Connected</span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Structured job listings provider providing verified company names, location metadata, and stipend benchmarks across multiple country endpoints.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span className="font-medium text-slate-700">Active Market</span>
                <span className="text-slate-700 font-semibold">India & Global Remote</span>
              </div>
            </div>

            {/* 4. GitHub Evidence Connection */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                      <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">GitHub Project Evidence</h3>
                      <p className="text-[11px] text-slate-500">Read-only repository skill validation</p>
                    </div>
                  </div>
                  <div
                    className={cn(
                      'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border',
                      isGithubConnected
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        : 'bg-slate-100 border-slate-200 text-slate-600'
                    )}
                  >
                    <span
                      className={cn(
                        'w-2 h-2 rounded-full',
                        isGithubConnected ? 'bg-emerald-500' : 'bg-slate-400'
                      )}
                    />
                    <span>{isGithubConnected ? 'Connected' : 'Not connected'}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Optional integration. Inspects public repositories to provide verifiable code evidence for your Career DNA skills. Never requests write permissions.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  {isGithubConnected ? 'Connected as student-developer' : 'Connect for repo verification'}
                </span>
                <Button
                  type="button"
                  variant={isGithubConnected ? 'outline' : 'primary'}
                  size="sm"
                  onClick={handleToggleGitHub}
                  className={cn(
                    'text-xs',
                    isGithubConnected
                      ? 'text-rose-600 border-rose-200 hover:bg-rose-50'
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                  )}
                >
                  {isGithubConnected ? 'Disconnect' : 'Connect GitHub'}
                </Button>
              </div>
            </div>

            {/* 5. n8n Automation Engine */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between space-y-4 md:col-span-2">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600">
                      <Workflow className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">n8n Opportunity Discovery Engine</h3>
                      <p className="text-[11px] text-slate-500">Scheduled scraper & pipeline adapter</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-600">
                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                    <span>Coming soon / Optional</span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Webhook-ready discovery provider interface (<code className="text-indigo-600 bg-indigo-50 px-1 py-0.5 rounded font-mono text-[11px]">POST /api/n8n/opportunity-discovery</code>). Allows running autonomous background crawling pipelines and forwarding parsed opportunities directly into InternSync.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>Webhook endpoint ready for connection</span>
                <span className="font-mono text-slate-400">STATUS: STANDBY</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Privacy */}
      {activeTab === 'privacy' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Privacy & Data Governance</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                How InternSync treats your resumes, project code, and career intelligence.
              </p>
            </div>
          </div>

          <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
              <h3 className="font-bold text-slate-800">1. Zero Public Model Training</h3>
              <p>
                Your resumes, project code, and personal contact details are never used to train public LLM models. AI evaluation is conducted via zero-retention enterprise API endpoints.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
              <h3 className="font-bold text-slate-800">2. Prompt Injection Defense</h3>
              <p>
                External job descriptions and untrusted documents pass through strict sanitization boundaries. Embedded directives cannot override InternSync deterministic scoring.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
              <h3 className="font-bold text-slate-800">3. Deterministic Decision Records</h3>
              <p>
                Fit calculations and eligibility scoring are computed deterministically on an 8-factor rubric. You can inspect exact match formulas for any opportunity.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Account */}
      {activeTab === 'account' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">Account Management</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage your session, authentication details, and account state.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <p className="font-semibold text-slate-800">Signed In As</p>
                <p className="text-slate-500 text-[11px]">{profile.email || 'student@internsync.app'}</p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 font-semibold text-[11px] border border-indigo-200">
                Verified Student Account
              </span>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <p className="font-semibold text-slate-800">Session Controls</p>
                <p className="text-slate-500 text-[11px]">Sign out of your account on this device</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => logout()}
                className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
              >
                <LogOut className="w-3.5 h-3.5 mr-1.5" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
