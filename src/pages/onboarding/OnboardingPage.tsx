import React, { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Brain,
  CheckCircle2,
  FileText,
  Sparkles,
  UploadCloud,
  Presentation,
} from 'lucide-react'
import { useApp } from '@/app/context'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils/cn'

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate()
  const { profile, updateProfile, uploadDocument } = useApp()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const presentationInputRef = useRef<HTMLInputElement>(null)

  const [currentStep, setCurrentStep] = useState(1)
  const [uploadedResumeName, setUploadedResumeName] = useState<string | null>(null)
  const [uploadedPresentationName, setUploadedPresentationName] = useState<string | null>(null)

  const [step1Error, setStep1Error] = useState('')
  const [formData, setFormData] = useState({
    fullName: profile.fullName || '',
    email: profile.email || '',
    university: profile.university || '',
    degree: profile.degree || '',
    branch: profile.branch || '',
    currentYear: profile.currentYear || 0,
    graduationYear: profile.graduationYear || 0,
    location: profile.location || '',
    preferredLocations: profile.preferredLocations?.join(', ') || '',
    workModePreference: profile.workModePreference || 'any',
    availableDurationMonths: profile.availableDurationMonths || 3,
    careerInterests: profile.careerInterests || [],
    targetRole: profile.targetRole || '',
  })

  // Resume upload & extraction states
  const [isUploading, setIsUploading] = useState(false)
  const [extractionStage, setExtractionStage] = useState(0)

  const extractionSteps = [
    'Reading document structure & layout',
    'Extracting education credentials',
    'Identifying technical skills & taxonomy',
    'Analyzing practical project evidence',
    'Synthesizing verified Career DNA signals',
  ]

  const interestOptions = [
    'AI / Machine Learning',
    'Software Engineering',
    'Full Stack Development',
    'Frontend Systems',
    'Backend Systems',
    'Data Science & Analytics',
    'Cloud & Infrastructure',
    'DevOps & SRE',
  ]

  const toggleInterest = (interest: string) => {
    setFormData((prev) => {
      const exists = prev.careerInterests.includes(interest)
      const updated = exists
        ? prev.careerInterests.filter((i) => i !== interest)
        : [...prev.careerInterests, interest]
      return { ...prev, careerInterests: updated }
    })
  }

  const handleFileUpload = async (file: File, type: 'resume' | 'presentation') => {
    setIsUploading(true)
    if (type === 'resume') {
      setUploadedResumeName(file.name)
    } else {
      setUploadedPresentationName(file.name)
    }
    setExtractionStage(1)

    try {
      const result = await uploadDocument(file, type)
      setExtractionStage(extractionSteps.length)

      if (result.updatedProfile) {
        setFormData((prev) => ({
          ...prev,
          fullName: prev.fullName || result.updatedProfile?.fullName || '',
          university: prev.university || result.updatedProfile?.university || '',
          degree: result.updatedProfile?.degree || prev.degree,
          branch: result.updatedProfile?.branch || prev.branch,
          currentYear: result.updatedProfile?.currentYear || prev.currentYear,
        }))
      }
    } catch {
      // Keep going
    } finally {
      setIsUploading(false)
    }
  }

  const handleFinish = () => {
    updateProfile({
      fullName: formData.fullName,
      email: formData.email,
      university: formData.university,
      degree: formData.degree,
      branch: formData.branch,
      currentYear: Number(formData.currentYear),
      graduationYear: Number(formData.graduationYear),
      location: formData.location,
      preferredLocations: formData.preferredLocations.split(',').map((s) => s.trim()),
      workModePreference: formData.workModePreference as any,
      availableDurationMonths: Number(formData.availableDurationMonths),
      careerInterests: formData.careerInterests,
      targetRole: formData.targetRole,
      githubUsername: profile.githubUsername,
    })

    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#fafbfc] text-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 selection:bg-indigo-100 selection:text-indigo-900">
      {/* Top Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-xs font-semibold text-indigo-700 mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Onboarding & Readiness Setup</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Welcome to InternSync
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Step {currentStep} of 6 • Let's build your evidence-based Career DNA
        </p>

        {/* Step Progress Dots */}
        <div className="flex items-center justify-center gap-2 mt-6">
          {[1, 2, 3, 4, 5, 6].map((step) => (
            <div
              key={step}
              className={cn(
                'h-1.5 rounded-full transition-all duration-300',
                step === currentStep
                  ? 'w-8 bg-indigo-600'
                  : step < currentStep
                  ? 'w-4 bg-emerald-500'
                  : 'w-4 bg-slate-200'
              )}
            />
          ))}
        </div>
      </div>

      {/* Main Card */}
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl bg-white p-6 sm:p-10 rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-200/50">
        {/* STEP 1: Tell us about yourself */}
        {currentStep === 1 && (
          <div className="space-y-5 animate-in fade-in">
            <div>
              <h2 className="text-xl font-bold text-slate-900">01. Tell us about yourself</h2>
              <p className="text-xs text-slate-500 mt-1">
                Your academic credentials provide the baseline for eligibility checks.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Full name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Arjun Verma"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  University / College
                </label>
                <input
                  type="text"
                  placeholder="e.g. IIT Madras or Delhi University"
                  value={formData.university}
                  onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Degree</label>
                <input
                  type="text"
                  value={formData.degree}
                  onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Branch</label>
                <input
                  type="text"
                  value={formData.branch}
                  onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Current Year of Study
                </label>
                <select
                  value={formData.currentYear}
                  onChange={(e) => setFormData({ ...formData, currentYear: Number(e.target.value) })}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value={0}>Select current year</option>
                  <option value={1}>1st Year (Fresher)</option>
                  <option value={2}>2nd Year (Sophomore)</option>
                  <option value={3}>3rd Year (Pre-final)</option>
                  <option value={4}>4th Year (Final)</option>
                  <option value={5}>5th Year (Dual Degree / Integrated)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Current Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bengaluru, India"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            {step1Error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                {step1Error}
              </div>
            )}

            <div className="pt-6 flex justify-end">
              <Button
                onClick={() => {
                  if (!formData.university.trim() || !formData.degree.trim()) {
                    setStep1Error('Please specify your university and degree program.')
                    return
                  }
                  if (!formData.currentYear || formData.currentYear < 1) {
                    setStep1Error('Please select your current year of study.')
                    return
                  }
                  setStep1Error('')
                  setCurrentStep(2)
                }}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs px-6 py-2.5 rounded-xl"
              >
                <span>Continue to Resume</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: Show us what you've built (Resume) */}
        {currentStep === 2 && (
          <div className="space-y-5 animate-in fade-in">
            <div>
              <h2 className="text-xl font-bold text-slate-900">02. Show us what you've built</h2>
              <p className="text-xs text-slate-500 mt-1">
                Upload your resume (PDF, DOCX). We extract verified skills, education, and project records.
              </p>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              accept=".pdf,.docx"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFileUpload(file, 'resume')
              }}
            />

            {!uploadedResumeName && !isUploading ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 hover:border-indigo-500/60 bg-slate-50/50 hover:bg-indigo-50/20 rounded-3xl p-8 text-center cursor-pointer transition-all space-y-3"
              >
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div className="text-xs font-bold text-slate-900">Click to upload your Resume</div>
                <div className="text-[11px] text-slate-400">PDF or Word document up to 10MB</div>
              </div>
            ) : isUploading ? (
              <div className="p-6 rounded-2xl bg-indigo-50/40 border border-indigo-200 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-bold text-slate-900">
                    Extracting skills from {uploadedResumeName}...
                  </span>
                </div>
                <div className="space-y-1.5 text-[11px]">
                  {extractionSteps.map((step, idx) => (
                    <div
                      key={step}
                      className={cn(
                        'flex items-center gap-2 transition-opacity',
                        idx <= extractionStage ? 'text-indigo-900 font-semibold' : 'text-slate-400 opacity-40'
                      )}
                    >
                      {idx < extractionStage ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                      )}
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-emerald-600" />
                  <div>
                    <div className="text-xs font-bold text-emerald-900">{uploadedResumeName}</div>
                    <div className="text-[11px] text-emerald-700">Successfully parsed into Career DNA</div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs"
                >
                  Replace
                </Button>
              </div>
            )}

            <div className="pt-4 flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep(1)} size="sm">
                <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                Back
              </Button>
              <Button
                onClick={() => setCurrentStep(3)}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs px-6"
              >
                Continue to Evidence
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: Add more evidence (PPT/Reports/Certificates) */}
        {currentStep === 3 && (
          <div className="space-y-5 animate-in fade-in">
            <div>
              <h2 className="text-xl font-bold text-slate-900">03. Add more evidence (Optional)</h2>
              <p className="text-xs text-slate-500 mt-1">
                Upload your project presentation decks (PPT/PPTX), research papers, or certificates to substantiate your skills with real artifacts.
              </p>
            </div>

            <input
              type="file"
              ref={presentationInputRef}
              accept=".pptx,.ppt,.pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFileUpload(file, 'presentation')
              }}
            />

            {!uploadedPresentationName ? (
              <div
                onClick={() => presentationInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 hover:border-indigo-500/60 bg-slate-50/50 hover:bg-indigo-50/20 rounded-3xl p-8 text-center cursor-pointer transition-all space-y-3"
              >
                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
                  <Presentation className="w-6 h-6" />
                </div>
                <div className="text-xs font-bold text-slate-900">Upload Project Presentation (PPTX / PDF)</div>
                <div className="text-[11px] text-slate-400">
                  Our native parser inspects slide XML, architecture diagrams, and tech stacks.
                </div>
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Presentation className="w-5 h-5 text-emerald-600" />
                  <div>
                    <div className="text-xs font-bold text-emerald-900">{uploadedPresentationName}</div>
                    <div className="text-[11px] text-emerald-700">Slide evidence parsed (+15% project weight)</div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => presentationInputRef.current?.click()}
                  className="text-xs"
                >
                  Change
                </Button>
              </div>
            )}

            <div className="pt-4 flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep(2)} size="sm">
                <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                Back
              </Button>
              <Button
                onClick={() => setCurrentStep(4)}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs px-6"
              >
                Continue to Goals
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4: Where do you want to go? */}
        {currentStep === 4 && (
          <div className="space-y-5 animate-in fade-in">
            <div>
              <h2 className="text-xl font-bold text-slate-900">04. Where do you want to go?</h2>
              <p className="text-xs text-slate-500 mt-1">
                Configure your target roles and preferences to calibrate query fan-out.
              </p>
            </div>

            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Target Internship Title
                </label>
                <input
                  type="text"
                  value={formData.targetRole}
                  onChange={(e) => setFormData({ ...formData, targetRole: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  placeholder="e.g. AI Engineering & Full-Stack Intern"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Preferred Work Mode
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['hybrid', 'remote', 'onsite'].map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setFormData({ ...formData, workModePreference: mode as any })}
                      className={cn(
                        'py-2.5 text-xs font-semibold capitalize rounded-xl border transition-all',
                        formData.workModePreference === mode
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-900 shadow-xs'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      )}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Domain Interests (Fan-out Query Builders)
                </label>
                <div className="flex flex-wrap gap-2">
                  {interestOptions.map((interest) => {
                    const active = formData.careerInterests.includes(interest)
                    return (
                      <button
                        key={interest}
                        type="button"
                        onClick={() => toggleInterest(interest)}
                        className={cn(
                          'px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all',
                          active
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        )}
                      >
                        {interest}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep(3)} size="sm">
                <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                Back
              </Button>
              <Button
                onClick={() => setCurrentStep(5)}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs px-6"
              >
                Review & Launch Workspace
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 5: Build my Career DNA */}
        {currentStep === 5 && (
          <div className="space-y-6 text-center animate-in zoom-in-95">
            <div className="w-14 h-14 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto border border-indigo-100 shadow-sm">
              <Brain className="w-7 h-7" />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-slate-900">Your profile is configured.</h2>
              <p className="text-xs text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
                We've synthesized your education, target goals, and uploaded evidence. When you enter your workspace, you can search live internship opportunities across configured sources.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs space-y-2 max-w-md mx-auto">
              <div className="flex justify-between pb-1.5 border-b border-slate-200">
                <span className="text-slate-500">Student Profile:</span>
                <span className="font-semibold text-slate-800">
                  {formData.fullName || 'Candidate'} ({formData.degree}, Year {formData.currentYear})
                </span>
              </div>
              <div className="flex justify-between pb-1.5 border-b border-slate-200">
                <span className="text-slate-500">Target Role:</span>
                <span className="font-semibold text-slate-800">{formData.targetRole}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Evidence Sources:</span>
                <span className="font-semibold text-emerald-600">
                  Resume {uploadedPresentationName ? '+ PPT' : ''}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <Button
                onClick={handleFinish}
                size="lg"
                className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-2xl shadow-lg shadow-indigo-600/20"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Build my Career DNA & Launch
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
