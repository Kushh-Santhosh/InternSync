import React, { useState } from 'react'
import {
  Sliders,
  MapPin,
  Briefcase,
  Clock,
  GraduationCap,
  Sparkles,
  Check,
  X,
} from 'lucide-react'
import type { StudentProfile, WorkMode } from '@/types'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'

export interface ResearchPreferencesModalProps {
  isOpen: boolean
  onClose: () => void
  profile: StudentProfile
  onSave: (updates: Partial<StudentProfile>) => Promise<boolean>
}

const COMMON_ROLES = [
  'Software Engineer Intern',
  'Frontend Developer Intern',
  'Backend Developer Intern',
  'Full Stack Intern',
  'Machine Learning / AI Intern',
  'Data Science Intern',
  'Product Design / UI/UX Intern',
  'DevOps / Cloud Intern',
]

const COMMON_LOCATIONS = [
  'Bengaluru, India',
  'Hyderabad, India',
  'Pune, India',
  'Gurugram / Delhi NCR, India',
  'Remote (Worldwide)',
  'Remote (India)',
  'United States',
  'Europe',
]

export const ResearchPreferencesModal: React.FC<ResearchPreferencesModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSave,
}) => {
  const [targetRole, setTargetRole] = useState(profile.targetRole || 'Software Engineer Intern')
  const [location, setLocation] = useState(profile.location || 'Bengaluru, India')
  const [workMode, setWorkMode] = useState<WorkMode>(profile.workModePreference || 'remote')
  const [duration, setDuration] = useState<number>(profile.availableDurationMonths || 3)
  const [graduationYear, setGraduationYear] = useState<number>(profile.graduationYear || 2026)
  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    await onSave({
      targetRole: targetRole.trim(),
      location: location.trim(),
      workModePreference: workMode,
      availableDurationMonths: Number(duration),
      graduationYear: Number(graduationYear),
    })
    setIsSaving(false)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Configure Internship Research Preferences">
      <form onSubmit={handleSubmit} className="space-y-5 text-xs">
        <p className="text-slate-500 leading-relaxed">
          Customize your discovery parameters. InternSync searches across Greenhouse, Lever, Ashby, and configured
          AI providers aligned to your chosen target roles and location preferences.
        </p>

        {/* Target Role */}
        <div className="space-y-1.5">
          <label className="font-bold text-slate-800 flex items-center gap-1.5">
            <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
            <span>Target Role Family</span>
          </label>
          <input
            type="text"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            placeholder="e.g. Software Engineer Intern, Product Designer"
            className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-indigo-500 font-medium"
            required
          />
          <div className="flex flex-wrap gap-1.5 pt-1">
            {COMMON_ROLES.map((r) => (
              <button
                type="button"
                key={r}
                onClick={() => setTargetRole(r)}
                className={`text-[10px] px-2 py-0.5 rounded-md border transition-colors cursor-pointer ${
                  targetRole.toLowerCase() === r.toLowerCase()
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Location & Preferred Regions */}
        <div className="space-y-1.5">
          <label className="font-bold text-slate-800 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-indigo-600" />
            <span>Preferred Location / Region</span>
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Bengaluru, Remote, India"
            className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-indigo-500 font-medium"
            required
          />
          <div className="flex flex-wrap gap-1.5 pt-1">
            {COMMON_LOCATIONS.map((loc) => (
              <button
                type="button"
                key={loc}
                onClick={() => setLocation(loc)}
                className={`text-[10px] px-2 py-0.5 rounded-md border transition-colors cursor-pointer ${
                  location.toLowerCase() === loc.toLowerCase()
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {loc}
              </button>
            ))}
          </div>
        </div>

        {/* Work Mode & Duration */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="font-bold text-slate-800 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-indigo-600" />
              <span>Work Mode</span>
            </label>
            <select
              value={workMode}
              onChange={(e) => setWorkMode(e.target.value as WorkMode)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-indigo-500 font-medium bg-white"
            >
              <option value="remote">Remote Only</option>
              <option value="hybrid">Hybrid</option>
              <option value="onsite">Onsite Only</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-800 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-600" />
              <span>Duration (Months)</span>
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-indigo-500 font-medium bg-white"
            >
              <option value={2}>2 Months (Summer Sprint)</option>
              <option value={3}>3 Months (Standard)</option>
              <option value={6}>6 Months (Co-op / Semester)</option>
              <option value={12}>12 Months (Year-long Placement)</option>
            </select>
          </div>
        </div>

        {/* Graduation Year */}
        <div className="space-y-1.5">
          <label className="font-bold text-slate-800 flex items-center gap-1.5">
            <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
            <span>Graduation Year</span>
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[2025, 2026, 2027, 2028].map((yr) => (
              <button
                type="button"
                key={yr}
                onClick={() => setGraduationYear(yr)}
                className={`py-2 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                  graduationYear === yr
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-2xs'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                {yr}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={isSaving}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
          >
            {isSaving ? 'Saving...' : 'Apply Preferences & Search'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
