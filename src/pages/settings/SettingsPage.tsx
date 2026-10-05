import React, { useState } from 'react'
import {
  User,
  Sliders,
  FileText,
  Lock,
  Shield,
  Save,
  Trash2,
  Upload,
  AlertTriangle,
  CheckCircle2,
  LogOut,
  Building,
  GraduationCap,
  Calendar,
  MapPin,
  Briefcase,
  FileCheck,
} from 'lucide-react'
import { useApp } from '@/app/context'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils/cn'

type SettingsTab = 'profile' | 'preferences' | 'documents' | 'account' | 'privacy'

export const SettingsPage: React.FC = () => {
  const { profile, updateProfile, logout } = useApp()
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile')

  // Profile form state
  const [fullName, setFullName] = useState(profile.fullName || '')
  const [email, setEmail] = useState(profile.email || '')
  const [university, setUniversity] = useState(profile.university || '')
  const [degree, setDegree] = useState(profile.degree || '')
  const [graduationYear, setGraduationYear] = useState(profile.graduationYear || '2026')
  const [currentYear, setCurrentYear] = useState(profile.currentYear || 3)

  // Career preferences state
  const [targetRole, setTargetRole] = useState(profile.targetRole || 'AI Engineer Intern')
  const [preferredLocations, setPreferredLocations] = useState(
    profile.preferredLocations?.join(', ') || 'Bengaluru, Remote'
  )
  const [workModePreference, setWorkModePreference] = useState(
    profile.workModePreference || 'hybrid'
  )
  const [availableDurationMonths, setAvailableDurationMonths] = useState(
    profile.availableDurationMonths || 3
  )
  const [careerInterests, setCareerInterests] = useState(
    profile.careerInterests?.join(', ') || 'Artificial Intelligence, Full-Stack Development, Data Engineering'
  )

  // Document mock/stored state
  const [documents, setDocuments] = useState([
    {
      id: 'doc-1',
      name: 'Primary_Resume_Latest.pdf',
      type: 'Resume',
      size: '245 KB',
      uploadedAt: 'Active primary resume',
    },
    {
      id: 'doc-2',
      name: 'Machine_Learning_Project_Summary.pdf',
      type: 'Project Evidence',
      size: '1.2 MB',
      uploadedAt: 'Oct 2026',
    },
    {
      id: 'doc-3',
      name: 'Python_Data_Science_Certification.pdf',
      type: 'Certificate',
      size: '512 KB',
      uploadedAt: 'Sep 2026',
    },
  ])

  // Password state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Feedback states
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

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
      university,
      degree,
      graduationYear: Number(graduationYear),
      currentYear: Number(currentYear),
    })
    setIsSaving(false)
    showToast('Profile information saved.')
  }

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    updateProfile({
      targetRole: targetRole.trim(),
      preferredLocations: preferredLocations.split(',').map((s: string) => s.trim()).filter(Boolean),
      workModePreference: workModePreference as 'remote' | 'hybrid' | 'onsite' | 'any',
      availableDurationMonths: Number(availableDurationMonths),
      careerInterests: careerInterests.split(',').map((s: string) => s.trim()).filter(Boolean),
    })
    setIsSaving(false)
    showToast('Career preferences saved.')
  }

  const handleDeleteDocument = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id))
    showToast('Document removed.')
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const file = files[0]
      const newDoc = {
        id: `doc-${Date.now()}`,
        name: file.name,
        type: file.name.endsWith('.pdf') ? 'Resume' : 'Document',
        size: `${Math.round(file.size / 1024)} KB`,
        uploadedAt: 'Just now',
      }
      setDocuments((prev) => [newDoc, ...prev])
      showToast(`Uploaded ${file.name}`)
    }
  }

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentPassword || !newPassword) {
      showToast('Please fill in password fields.')
      return
    }
    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match.')
      return
    }
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    showToast('Password updated successfully.')
  }

  const tabs = [
    { id: 'profile' as const, label: 'Profile', icon: User },
    { id: 'preferences' as const, label: 'Career Preferences', icon: Sliders },
    { id: 'documents' as const, label: 'Documents', icon: FileText },
    { id: 'account' as const, label: 'Account', icon: Lock },
    { id: 'privacy' as const, label: 'Privacy', icon: Shield },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-slate-900 text-white text-sm font-medium shadow-xl border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your personal details, career goals, uploaded documents, and account preferences.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-1 overflow-x-auto pb-px">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 cursor-pointer whitespace-nowrap',
                isActive
                  ? 'border-indigo-600 text-indigo-600 bg-indigo-50/40'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              )}
            >
              <Icon className={cn('w-4 h-4', isActive ? 'text-indigo-600' : 'text-slate-400')} />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* TAB 1: PROFILE */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="space-y-6 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div>
            <h2 className="text-base font-bold text-slate-900">Personal Information</h2>
            <p className="text-xs text-slate-500 mt-0.5">Your academic profile used to evaluate internship eligibility.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Kushal Sharma"
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@university.edu"
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                College / University
              </label>
              <input
                type="text"
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                placeholder="e.g. National Institute of Technology"
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                Degree Program
              </label>
              <input
                type="text"
                value={degree}
                onChange={(e) => setDegree(e.target.value)}
                placeholder="e.g. B.Tech in Computer Science"
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Current Year of Study
              </label>
              <select
                value={currentYear}
                onChange={(e) => setCurrentYear(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
              >
                <option value={1}>1st Year (Freshman)</option>
                <option value={2}>2nd Year (Sophomore)</option>
                <option value={3}>3rd Year (Junior)</option>
                <option value={4}>4th Year (Senior / Final)</option>
                <option value={5}>Postgraduate / Master's</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Graduation Year</label>
              <input
                type="text"
                value={graduationYear}
                onChange={(e) => setGraduationYear(e.target.value)}
                placeholder="e.g. 2026"
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100">
            <Button type="submit" disabled={isSaving} className="gap-2">
              <Save className="w-4 h-4" />
              <span>Save Profile</span>
            </Button>
          </div>
        </form>
      )}

      {/* TAB 2: CAREER PREFERENCES */}
      {activeTab === 'preferences' && (
        <form onSubmit={handleSavePreferences} className="space-y-6 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div>
            <h2 className="text-base font-bold text-slate-900">Career Preferences</h2>
            <p className="text-xs text-slate-500 mt-0.5">Customize the roles, work arrangements, and domains InternSync tracks for you.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                Target Role
              </label>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="AI Engineer Intern"
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">Opportunities matching this role receive prioritized readiness scoring.</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  Preferred Locations
                </label>
                <input
                  type="text"
                  value={preferredLocations}
                  onChange={(e) => setPreferredLocations(e.target.value)}
                  placeholder="Bengaluru, Hyderabad, Remote"
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Work Arrangement</label>
                <select
                  value={workModePreference}
                  onChange={(e) => setWorkModePreference(e.target.value as any)}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                >
                  <option value="any">Any (Remote, Hybrid, On-site)</option>
                  <option value="remote">Remote Only</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="onsite">On-site</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Internship Availability</label>
                <select
                  value={availableDurationMonths}
                  onChange={(e) => setAvailableDurationMonths(Number(e.target.value))}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                >
                  <option value={2}>2 months (Summer)</option>
                  <option value={3}>3 months (Quarter)</option>
                  <option value={6}>6 months (Semester)</option>
                  <option value={12}>12 months (Year-round)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Career Interests & Domains</label>
                <input
                  type="text"
                  value={careerInterests}
                  onChange={(e) => setCareerInterests(e.target.value)}
                  placeholder="AI/ML, Web Systems, Cloud"
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100">
            <Button type="submit" disabled={isSaving} className="gap-2">
              <Save className="w-4 h-4" />
              <span>Save Preferences</span>
            </Button>
          </div>
        </form>
      )}

      {/* TAB 3: DOCUMENTS */}
      {activeTab === 'documents' && (
        <div className="space-y-6 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Uploaded Documents</h2>
              <p className="text-xs text-slate-500 mt-0.5">Resumes, project files, and certifications that back your Career DNA.</p>
            </div>

            <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer transition-colors shadow-xs">
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Document</span>
              <input type="file" onChange={handleFileUpload} accept=".pdf,.doc,.docx,.ppt,.pptx" className="hidden" />
            </label>
          </div>

          {/* Document list */}
          <div className="space-y-2.5">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/80 hover:border-slate-300 bg-slate-50/50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-indigo-100/70 text-indigo-600 flex items-center justify-center shrink-0">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-slate-900 truncate">{doc.name}</h3>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                      <span className="font-medium text-indigo-600">{doc.type}</span>
                      <span>•</span>
                      <span>{doc.size}</span>
                      <span>•</span>
                      <span>{doc.uploadedAt}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleDeleteDocument(doc.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Delete document"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600">
            <span className="font-semibold text-slate-800">Supported formats:</span> PDF, DOC, DOCX, PPT, PPTX up to 15MB. When you replace your primary resume, your Career DNA and opportunity matches automatically re-synchronize.
          </div>
        </div>
      )}

      {/* TAB 4: ACCOUNT */}
      {activeTab === 'account' && (
        <div className="space-y-6">
          {/* Change Password Card */}
          <form onSubmit={handleChangePassword} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Change Password</h2>
              <p className="text-xs text-slate-500 mt-0.5">Ensure your account is using a secure, unique password.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" variant="secondary" size="sm">
                Update Password
              </Button>
            </div>
          </form>

          {/* Session & Sign Out Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Session</h2>
              <p className="text-xs text-slate-500 mt-0.5">Signed in as {profile.email || 'your account'}</p>
            </div>
            <Button variant="outline" onClick={logout} className="gap-2 text-rose-600 border-rose-200 hover:bg-rose-50 self-start sm:self-auto">
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </Button>
          </div>

          {/* Danger Zone: Delete Account */}
          <div className="bg-white p-6 rounded-2xl border border-rose-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 text-rose-600">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h2 className="text-base font-bold">Danger Zone</h2>
            </div>
            <p className="text-xs text-slate-600">
              Deleting your account permanently removes your profile, Career DNA, uploaded documents, assessment scores, and saved internship applications. This action is irreversible.
            </p>

            {deleteConfirmOpen ? (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-3">
                <p className="text-xs font-semibold text-rose-900">
                  Are you absolutely certain? This will delete all your data immediately.
                </p>
                <div className="flex items-center gap-3">
                  <Button
                    variant="primary"
                    className="bg-rose-600 hover:bg-rose-700 text-white"
                    onClick={() => {
                      logout()
                      showToast('Account deleted.')
                    }}
                  >
                    Yes, Delete My Account
                  </Button>
                  <Button variant="ghost" onClick={() => setDeleteConfirmOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                onClick={() => setDeleteConfirmOpen(true)}
                className="border-rose-300 text-rose-700 hover:bg-rose-50 text-xs"
              >
                Delete Account
              </Button>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: PRIVACY */}
      {activeTab === 'privacy' && (
        <div className="space-y-6 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div>
            <h2 className="text-base font-bold text-slate-900">Privacy & Data Governance</h2>
            <p className="text-xs text-slate-500 mt-0.5">Control how your evidence is processed and clear stored data anytime.</p>
          </div>

          <div className="space-y-4 divide-y divide-slate-100">
            <div className="pt-2">
              <h3 className="text-sm font-semibold text-slate-800">Data Usage</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                InternSync processes your uploaded resumes and project documents solely to extract skills, evaluate internship eligibility, and generate personalized roadmaps. Your resume is never sold to third parties or recruiters without your explicit consent.
              </p>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">Clear Career DNA</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Reset your extracted skills, project evidence links, and readiness scores. You can regenerate it by re-uploading a resume.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  updateProfile({
                    targetRole: 'Software Engineering Intern',
                    careerInterests: [],
                  })
                  showToast('Career DNA cleared.')
                }}
                className="self-start sm:self-auto text-xs"
              >
                Reset Career DNA
              </Button>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">Purge Uploaded Documents</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Permanently delete all stored resume files, project summaries, and certificates from cloud storage.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setDocuments([])
                  showToast('All uploaded documents purged.')
                }}
                className="self-start sm:self-auto text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
              >
                Purge All Files
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
