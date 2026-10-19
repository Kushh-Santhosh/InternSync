import React, { useState } from 'react'
import {
  CheckCircle2,
  AlertCircle,
  FileText,
  RotateCcw,
  Save,
  User,
} from 'lucide-react'
import { useApp } from '@/app/context'
import { Button } from '@/components/ui/Button'
import { UserAvatar } from '@/components/common/UserAvatar'

const AVATAR_PRESETS = [
  { label: 'Tech', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=160' },
  { label: 'Design', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=160' },
  { label: 'Data AI', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=160' },
  { label: 'Full Stack', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=160' },
]

import { isSyntheticEmail } from '@/lib/supabase/auth-username'

export const ProfilePage: React.FC = () => {
  const { profile, updateProfile, resetToDemo } = useApp()

  const [savedSuccess, setSavedSuccess] = useState(false)
  const [formData, setFormData] = useState({
    fullName: profile.fullName,
    username: profile.username || '',
    email: isSyntheticEmail(profile.email) ? '' : (profile.email || ''),
    avatarUrl: profile.avatarUrl || '',
    university: profile.university,
    degree: profile.degree,
    branch: profile.branch,
    currentYear: profile.currentYear,
    graduationYear: profile.graduationYear,
    location: profile.location,
    preferredLocations: profile.preferredLocations.join(', '),
    workModePreference: profile.workModePreference,
    availableDurationMonths: profile.availableDurationMonths,
    targetRole: profile.targetRole,
    bio: profile.bio || '',
  })
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    try {
      await updateProfile({
        ...formData,
        currentYear: Number(formData.currentYear),
        graduationYear: Number(formData.graduationYear),
        availableDurationMonths: Number(formData.availableDurationMonths),
        preferredLocations: formData.preferredLocations.split(',').map((s) => s.trim()),
      })
      setSavedSuccess(true)
      setTimeout(() => setSavedSuccess(false), 3000)
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to save profile.')
    }
  }

  return (
    <div className="space-y-8 max-w-3xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 mb-1">
            <User className="w-3.5 h-3.5" />
            <span>Candidate Profile Settings</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Academic & Career Preferences
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Updating your profile triggers automatic recalculation of all opportunity match scores.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={resetToDemo}
          className="self-start sm:self-auto text-xs"
        >
          <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
          <span>Reset to Defaults</span>
        </Button>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Profile saved successfully! Opportunity match scores have been recalculated.</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800 flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Profile Form */}
      <form
        onSubmit={handleSave}
        className="p-6 sm:p-8 rounded-3xl border border-slate-200 bg-white shadow-xs space-y-6"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pb-5 border-b border-slate-100">
          <UserAvatar
            fullName={formData.fullName || profile.fullName}
            avatarUrl={formData.avatarUrl}
            size="lg"
            className="rounded-2xl shrink-0"
          />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">{formData.fullName || profile.fullName}</h3>
            <p className="text-xs text-slate-500">
              {profile.degree} in {profile.branch} (Year {profile.currentYear})
            </p>
            <div className="flex items-center gap-2 text-[11px] text-indigo-600 font-medium">
              <FileText className="w-3.5 h-3.5" />
              <span>{profile.resumeFileName || 'Resume Loaded'}</span>
            </div>
            {/* Avatar Presets */}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <span className="text-[11px] text-slate-400 font-medium">Choose avatar:</span>
              {AVATAR_PRESETS.map((preset) => (
                <button
                  type="button"
                  key={preset.label}
                  onClick={() => setFormData({ ...formData, avatarUrl: preset.url })}
                  className="px-2 py-0.5 text-[10px] font-semibold rounded-md border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-colors cursor-pointer"
                >
                  {preset.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setFormData({ ...formData, avatarUrl: '' })}
                className="px-2 py-0.5 text-[10px] font-semibold rounded-md border border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Use Initials
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-indigo-500"
            />
          </div>

          {profile.username && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Username</label>
              <input
                type="text"
                disabled
                value={`@${profile.username}`}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 font-mono cursor-not-allowed"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Contact Email {profile.username && <span className="text-slate-400 font-normal">(optional)</span>}
            </label>
            <input
              type="email"
              placeholder={profile.username ? 'e.g. name@university.edu (optional)' : 'name@university.edu'}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">University</label>
            <input
              type="text"
              value={formData.university}
              onChange={(e) => setFormData({ ...formData, university: e.target.value })}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Degree</label>
            <input
              type="text"
              value={formData.degree}
              onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Academic Year</label>
            <select
              value={formData.currentYear}
              onChange={(e) => setFormData({ ...formData, currentYear: Number(e.target.value) })}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-indigo-500"
            >
              <option value={1}>1st Year</option>
              <option value={2}>2nd Year</option>
              <option value={3}>3rd Year (Summer 2025 Target)</option>
              <option value={4}>4th Year</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Graduation Year</label>
            <input
              type="number"
              value={formData.graduationYear}
              onChange={(e) => setFormData({ ...formData, graduationYear: Number(e.target.value) })}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Current Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Preferred Internship Duration (Months)
            </label>
            <input
              type="number"
              value={formData.availableDurationMonths}
              onChange={(e) =>
                setFormData({ ...formData, availableDurationMonths: Number(e.target.value) })
              }
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Target Role Objectives
          </label>
          <input
            type="text"
            value={formData.targetRole}
            onChange={(e) => setFormData({ ...formData, targetRole: e.target.value })}
            className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-indigo-500"
          />
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <Button size="md" type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">
            <Save className="w-4 h-4 mr-1.5" />
            <span>Save & Recalculate Matches</span>
          </Button>
        </div>
      </form>
    </div>
  )
}
