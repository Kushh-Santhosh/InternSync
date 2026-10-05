import React, { useState } from 'react'
import {
  CheckCircle2,
  FileText,
  RotateCcw,
  Save,
  User,
} from 'lucide-react'
import { useApp } from '@/app/context'
import { Button } from '@/components/ui/Button'

export const ProfilePage: React.FC = () => {
  const { profile, updateProfile, resetToDemo } = useApp()

  const [savedSuccess, setSavedSuccess] = useState(false)
  const [formData, setFormData] = useState({
    fullName: profile.fullName,
    email: profile.email,
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

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    updateProfile({
      ...formData,
      currentYear: Number(formData.currentYear),
      graduationYear: Number(formData.graduationYear),
      availableDurationMonths: Number(formData.availableDurationMonths),
      preferredLocations: formData.preferredLocations.split(',').map((s) => s.trim()),
    })
    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 3000)
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
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Profile saved successfully! Opportunity match scores have been recalculated.</span>
        </div>
      )}

      {/* Profile Form */}
      <form
        onSubmit={handleSave}
        className="p-6 sm:p-8 rounded-3xl border border-slate-200 bg-white shadow-xs space-y-6"
      >
        <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
          <img
            src={profile.avatarUrl}
            alt={profile.fullName}
            className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shadow-2xs"
          />
          <div>
            <h3 className="text-base font-bold text-slate-900">{profile.fullName}</h3>
            <p className="text-xs text-slate-500">
              {profile.degree} in {profile.branch} (Year {profile.currentYear})
            </p>
            <div className="mt-1 flex items-center gap-2 text-[11px] text-indigo-600 font-medium">
              <FileText className="w-3.5 h-3.5" />
              <span>{profile.resumeFileName || 'Resume Loaded'}</span>
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

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
            <input
              type="email"
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
