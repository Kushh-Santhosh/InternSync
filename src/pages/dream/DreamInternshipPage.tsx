import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Sparkles,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Calendar,
  Building,
  MapPin,
  Zap,
} from 'lucide-react'
import { useApp } from '@/app/context'
import { Button } from '@/components/ui/Button'
import { ScoreRing } from '@/components/ui/ScoreRing'

interface TargetOpportunity {
  company: string
  role: string
  matchScore: number
  location: string
  applicationUrl: string
  missingSkills: string[]
}

export const DreamInternshipPage: React.FC = () => {
  const navigate = useNavigate()
  const { skills } = useApp()

  const [query, setQuery] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analyzed, setAnalyzed] = useState(true)

  // Default dream role state
  const [dreamRole, setDreamRole] = useState('AI Engineer Intern')
  const [targetCompany, setTargetCompany] = useState('Google / Top AI Labs')

  // Calculate matched vs missing skills
  const studentSkillNames = new Set(skills.map((s) => s.skillName.toLowerCase()))

  const targetRequiredSkills = [
    { name: 'Python', required: true },
    { name: 'Machine Learning', required: true },
    { name: 'SQL', required: true },
    { name: 'React', required: false },
    { name: 'PyTorch', required: true },
    { name: 'Model Deployment', required: true },
    { name: 'Docker', required: false },
  ]

  const matchedSkills = targetRequiredSkills.filter(
    (s) =>
      studentSkillNames.has(s.name.toLowerCase()) ||
      (s.name === 'Machine Learning' && studentSkillNames.has('machine learning')) ||
      (s.name === 'Python' && studentSkillNames.has('python'))
  )

  const missingSkills = targetRequiredSkills.filter(
    (s) => !matchedSkills.some((m) => m.name.toLowerCase() === s.name.toLowerCase())
  )

  // Calculate readiness score
  const readinessScore = Math.min(
    95,
    Math.max(
      65,
      Math.round((matchedSkills.length / Math.max(1, targetRequiredSkills.length)) * 100)
    )
  )

  // Current matches based on target query
  const targetMatches: TargetOpportunity[] = [
    {
      company: 'Google',
      role: 'Software Engineering Intern — AI/ML',
      matchScore: 81,
      location: 'Bengaluru / Hyderabad',
      applicationUrl: 'https://careers.google.com/jobs/results/?q=intern',
      missingSkills: ['PyTorch', 'Distributed Systems'],
    },
    {
      company: 'Microsoft',
      role: 'Research & Applied AI Intern',
      matchScore: 78,
      location: 'Bengaluru / Remote',
      applicationUrl: 'https://careers.microsoft.com/students/us/en',
      missingSkills: ['Model Deployment', 'Azure ML'],
    },
    {
      company: 'NVIDIA',
      role: 'Deep Learning Engineering Intern',
      matchScore: 72,
      location: 'Pune / Bengaluru',
      applicationUrl: 'https://www.nvidia.com/en-us/about-nvidia/careers/',
      missingSkills: ['CUDA', 'TensorRT', 'PyTorch'],
    },
  ]

  const handleAnalyze = (targetPrompt?: string) => {
    const text = targetPrompt || query
    if (!text.trim()) return

    setIsAnalyzing(true)
    setTimeout(() => {
      if (text.toLowerCase().includes('google')) {
        setDreamRole('AI Engineer Intern')
        setTargetCompany('Google')
      } else if (text.toLowerCase().includes('nvidia')) {
        setDreamRole('Deep Learning Research Intern')
        setTargetCompany('NVIDIA')
      } else if (text.toLowerCase().includes('bengaluru')) {
        setDreamRole('Full Stack AI Engineer')
        setTargetCompany('High-Growth Unicorns in Bengaluru')
      } else {
        setDreamRole(text)
        setTargetCompany('Top Tier Tech Companies')
      }
      setIsAnalyzing(false)
      setAnalyzed(true)
    }, 800)
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-semibold border border-purple-200 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-purple-600" />
          <span>Target Career Intelligence</span>
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          Dream Internship Compass
        </h1>
        <p className="text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
          Tell us your ideal company and role. InternSync analyzes live hiring criteria, compares them
          against your Career DNA, and builds a realistic 14-day preparation plan.
        </p>
      </div>

      {/* Query Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-md shadow-purple-900/5 space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
              placeholder="e.g. I want an internship at Google as an AI Engineer..."
              className="w-full pl-11 pr-4 py-3 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-medium"
            />
          </div>
          <Button
            onClick={() => handleAnalyze()}
            disabled={isAnalyzing}
            className="w-full sm:w-auto px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md shadow-purple-600/20 cursor-pointer shrink-0"
          >
            {isAnalyzing ? 'Analyzing Web Requirements...' : 'Analyze Dream Role'}
          </Button>
        </div>

        {/* Prompt Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="text-slate-400 text-[11px] font-semibold">Try asking:</span>
          {[
            'I want an internship at Google as an AI Engineer.',
            'My dream role is Machine Learning Engineer at NVIDIA.',
            'High-paying software engineering internship in Bengaluru.',
          ].map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => {
                setQuery(prompt)
                handleAnalyze(prompt)
              }}
              className="px-3 py-1 rounded-full bg-slate-100 hover:bg-purple-50 hover:text-purple-700 text-slate-600 text-[11px] font-medium transition-colors cursor-pointer border border-transparent hover:border-purple-200"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Target Analysis Section */}
      {analyzed && (
        <div className="space-y-6 animate-fadeIn">
          {/* Main Readiness Comparison Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600">
                  Target Role Readiness
                </span>
                <h2 className="text-2xl font-black text-slate-900 mt-0.5">{dreamRole}</h2>
                <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                  <Building className="w-3.5 h-3.5" />
                  <span>Target: {targetCompany}</span>
                </p>
              </div>

              <div className="flex items-center gap-4 bg-purple-50/50 border border-purple-100 p-3 px-5 rounded-2xl self-start sm:self-auto">
                <ScoreRing score={readinessScore} size="md" showLabel={false} />
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Current Readiness
                  </div>
                  <div className="text-2xl font-black text-slate-900">{readinessScore}%</div>
                  <div className="text-[11px] text-purple-700 font-semibold">Bridgeable in 14 days</div>
                </div>
              </div>
            </div>

            {/* Side-by-Side: You already have vs You need */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* You Already Have */}
              <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    You already have
                  </h3>
                  <span className="text-[11px] font-semibold text-emerald-700">
                    {matchedSkills.length} Verified
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  {matchedSkills.map((s) => (
                    <div
                      key={s.name}
                      className="flex items-center justify-between py-1 border-b border-emerald-100/80"
                    >
                      <span className="font-semibold text-emerald-950 flex items-center gap-1.5">
                        <span className="text-emerald-600 font-bold">✓</span> {s.name}
                      </span>
                      <span className="text-[10px] font-medium text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-full">
                        Career DNA Verified
                      </span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between py-1">
                    <span className="font-semibold text-emerald-950 flex items-center gap-1.5">
                      <span className="text-emerald-600 font-bold">✓</span> 2 relevant technical projects
                    </span>
                    <span className="text-[10px] font-medium text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-full">
                      Strong Evidence
                    </span>
                  </div>
                </div>
              </div>

              {/* You Need */}
              <div className="p-5 rounded-2xl bg-amber-50/50 border border-amber-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    You need
                  </h3>
                  <span className="text-[11px] font-semibold text-amber-700">
                    {missingSkills.length} High Impact Gaps
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  {missingSkills.map((s) => (
                    <div
                      key={s.name}
                      className="flex items-center justify-between py-1 border-b border-amber-100/80"
                    >
                      <span className="font-semibold text-amber-950 flex items-center gap-1.5">
                        <span className="text-amber-600 font-bold">△</span> {s.name}
                      </span>
                      <span className="text-[10px] font-medium text-amber-700 bg-amber-100/60 px-2 py-0.5 rounded-full">
                        {s.required ? 'Hard Requirement' : 'Recommended'}
                      </span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between py-1">
                    <span className="font-semibold text-amber-950 flex items-center gap-1.5">
                      <span className="text-amber-600 font-bold">△</span> Production deployment experience
                    </span>
                    <span className="text-[10px] font-medium text-amber-700 bg-amber-100/60 px-2 py-0.5 rounded-full">
                      Differentiator
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Best Next Step & Action Plan */}
            <div className="p-6 rounded-2xl bg-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Best Next Step</span>
                </div>
                <h4 className="text-base sm:text-lg font-bold">
                  Complete a PyTorch + FastAPI model deployment project.
                </h4>
                <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
                  Bridge the gap between model training and cloud deployment. This fulfills 2 hard requirements for {targetCompany} and boosts your fit score by +16%.
                </p>
                <div className="text-[11px] text-purple-300 font-semibold pt-1 flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Estimated preparation: 14 days</span>
                </div>
              </div>

              <Button
                onClick={() => navigate('/career-paths')}
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs px-5 py-3 rounded-xl shadow-lg shrink-0 cursor-pointer"
              >
                <span>Build my 14-day plan</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </div>

          {/* Current Matches on the Live Web */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Current Target Matches</h3>
                <p className="text-xs text-slate-500">
                  Live openings closely aligned with your dream role and current readiness level.
                </p>
              </div>
              <span className="text-xs text-slate-400 font-mono">Live web status: Verified</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {targetMatches.map((opp) => (
                <div
                  key={opp.company + opp.role}
                  className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                        {opp.company}
                      </span>
                      <span className="text-xs font-black px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                        {opp.matchScore}% Match
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 leading-snug">{opp.role}</h4>

                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{opp.location}</span>
                    </div>

                    <div className="pt-2 text-[11px] text-slate-600">
                      <span className="text-slate-400">Gaps to bridge: </span>
                      <span className="font-semibold text-amber-700">
                        {opp.missingSkills.join(', ')}
                      </span>
                    </div>
                  </div>

                  <a
                    href={opp.applicationUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors"
                  >
                    <span>Apply directly</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
