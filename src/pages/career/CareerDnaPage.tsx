import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CheckCircle2,
  Code2,
  Compass,
  ExternalLink,
  FileCheck2,
  FileText,
  ShieldCheck,
  User,
} from 'lucide-react'
import { useApp } from '@/app/context'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils/cn'

export const CareerDnaPage: React.FC = () => {
  const navigate = useNavigate()
  const { profile, skills, projects } = useApp()

  const [selectedFilter, setSelectedFilter] = useState<'all' | 'languages' | 'frontend' | 'ai_ml' | 'data' | 'tools'>('all')

  const careerDirections = [
    { title: 'AI / Machine Learning Engineering', fit: 88, note: 'Strongest project proof in FastAPI, vector search, and OpenCV' },
    { title: 'Full-Stack Software Engineering', fit: 84, note: 'Demonstrated React, TypeScript, and clean component systems' },
    { title: 'Data Science & Analytics', fit: 72, note: 'Good SQL base; benefit from Pandas statistical exercises' },
    { title: 'Technical Product Management', fit: 62, note: 'High empathy for developer UX; requires PRD specification evidence' },
  ]

  const filteredSkills = skills.filter((s) => {
    if (selectedFilter === 'all') return true
    return s.category === selectedFilter
  })

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            YOUR CAREER DNA
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            A living profile built from your education, experience, projects and skills.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            onClick={() => navigate('/skill-lab')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
          >
            <FileCheck2 className="w-4 h-4 mr-1.5" />
            <span>Validate a Skill</span>
          </Button>
        </div>
      </div>

      {/* SECTION 1: PROFILE OVERVIEW */}
      <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-600" />
            <span>1. Profile Identity</span>
          </h3>
          <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full">
            Active Candidate
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-4 text-xs">
          <div>
            <span className="text-slate-400 font-medium block">Full Name:</span>
            <span className="text-sm font-bold text-slate-900 mt-0.5 block">{profile.fullName}</span>
          </div>
          <div>
            <span className="text-slate-400 font-medium block">Academic Standing:</span>
            <span className="text-sm font-bold text-slate-900 mt-0.5 block">
              {profile.degree} (Year {profile.currentYear})
            </span>
          </div>
          <div>
            <span className="text-slate-400 font-medium block">Institution:</span>
            <span className="text-sm font-bold text-slate-900 mt-0.5 block truncate">
              {profile.university}
            </span>
          </div>
          <div>
            <span className="text-slate-400 font-medium block">Location / Work Mode:</span>
            <span className="text-sm font-bold text-slate-900 mt-0.5 block">
              {profile.location} ({profile.workModePreference})
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 2: CAREER DIRECTION */}
      <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Compass className="w-4 h-4 text-indigo-600" />
            <span>2. Career Direction Signals</span>
          </h3>
          <button
            onClick={() => navigate('/career-paths')}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
          >
            Retake Direction Quiz →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {careerDirections.map((dir) => (
            <div key={dir.title} className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">{dir.title}</span>
                  <span className="text-xs font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                    {dir.fit}% Fit
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{dir.note}</p>
              </div>
              <div className="w-full h-1.5 bg-slate-200 rounded-full mt-3 overflow-hidden">
                <div
                  className="h-full bg-indigo-600 rounded-full"
                  style={{ width: `${dir.fit}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 3 & 4: SKILLS & MULTI-SOURCE EVIDENCE */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-indigo-600" />
              <span>3 & 4. Verified Skills & Multi-Source Evidence</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Confidence is backed by resume claims, project code, and Skill Lab assessment scores.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {(['all', 'languages', 'frontend', 'ai_ml', 'data', 'tools'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedFilter(cat)}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-colors cursor-pointer',
                  selectedFilter === cat
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                )}
              >
                {cat === 'all' ? 'All Skills' : cat.replace('_', '/')}
              </button>
            ))}
          </div>
        </div>

        {/* Skills Evidence Grid (Meeting Priority 7 specification) */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSkills.map((skill) => {
            const hasResume = skill.evidenceSources.includes('resume')
            const hasProject = skill.projectCount > 0
            const hasAssessment = Boolean(skill.assessmentScore)

            return (
              <div
                key={skill.skillName}
                className="p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-200 hover:shadow-xs transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-900">{skill.skillName}</span>
                    <span
                      className={cn(
                        'text-xs font-black px-2 py-0.5 rounded border',
                        skill.confidence >= 80
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : skill.confidence >= 65
                          ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      )}
                    >
                      {skill.confidence}%
                    </span>
                  </div>

                  {/* Explicit 4-Source Evidence Checklist (Priority 7 Spec) */}
                  <div className="mt-3.5 space-y-1.5 text-xs bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                        <span>Resume</span>
                      </span>
                      {hasResume ? (
                        <span className="font-bold text-emerald-600">✓ Verified</span>
                      ) : (
                        <span className="font-medium text-slate-400">~ Inferred</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 flex items-center gap-1.5">
                        <Code2 className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Projects</span>
                      </span>
                      {hasProject ? (
                        <span className="font-bold text-emerald-600">✓ {skill.projectCount} Project(s)</span>
                      ) : (
                        <span className="font-medium text-slate-400">~ Pending</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Skill Lab Assessment</span>
                      </span>
                      {hasAssessment ? (
                        <span className="font-bold text-emerald-600">✓ {skill.assessmentScore}%</span>
                      ) : (
                        <span className="font-medium text-slate-400">~ Unverified</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => navigate(`/skill-lab?skill=${encodeURIComponent(skill.skillName)}`)}
                  >
                    <FileCheck2 className="w-3.5 h-3.5 mr-1" />
                    <span>{hasAssessment ? 'Retake Signal Test' : 'Validate Skill Signal'}</span>
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* SECTION 5: PROJECT PROOF & REPOSITORIES */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Code2 className="w-4 h-4 text-indigo-600" />
            <span>5. Projects Evidence Repository</span>
          </h3>
          <span className="text-xs text-slate-500">3 Validated Projects</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {projects.map((proj) => (
            <div
              key={proj.id}
              className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-bold text-slate-900">{proj.title}</h4>
                  <Badge
                    variant={proj.evidenceStrength === 'strong' ? 'success' : 'secondary'}
                    size="sm"
                  >
                    {proj.evidenceStrength}
                  </Badge>
                </div>

                <p className="text-xs text-slate-600 mt-2 leading-relaxed">{proj.description}</p>

                <div className="mt-3 space-y-1">
                  {proj.highlights.map((h, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-[11px] text-slate-600">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-1.5 mt-4">
                  {proj.technologies.map((t) => (
                    <span
                      key={t}
                      className="text-[10px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {proj.repositoryUrl && (
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <a
                    href={proj.repositoryUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-600 font-semibold hover:underline flex items-center gap-1"
                  >
                    <Code2 className="w-3.5 h-3.5" />
                    <span>View Project Source</span>
                  </a>
                  {proj.liveUrl && (
                    <a
                      href={proj.liveUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-slate-500 hover:text-slate-800 flex items-center gap-1"
                    >
                      <span>Demo</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 6: ASSESSMENT SIGNALS */}
      <div className="p-6 rounded-2xl border border-indigo-200 bg-indigo-50/40 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
            <span>6. Verified Assessment Signals</span>
          </div>
          <h4 className="text-base font-bold text-slate-900">
            Python (88%) · React (82%) · SQL (60%)
          </h4>
          <p className="text-xs text-slate-600 max-w-xl">
            Skill Lab signals represent objective, scenario-based problem solving. They serve as audit proof
            for recruiters without requiring unverified self-assessment keywords.
          </p>
        </div>

        <Button
          size="md"
          onClick={() => navigate('/skill-lab')}
          className="bg-indigo-600 hover:bg-indigo-700 text-white shrink-0 text-xs font-semibold"
        >
          <span>Open Skill Lab</span>
          <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
        </Button>
      </div>
    </div>
  )
}
