import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Compass,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ScoreRing } from '@/components/ui/ScoreRing'

import { useApp } from '@/app/context'

export const CareerPathsPage: React.FC = () => {
  const navigate = useNavigate()
  const { skills } = useApp()
  const [preferences, setPreferences] = useState({
    problemType: 'building_products',
    codePreference: 'deep_logic',
    dataStyle: 'interactive_apps',
    teamStyle: 'fast_paced_startups',
  })

  const [hasCalculated, setHasCalculated] = useState(false)

  const skillNames = new Set(skills.map((s) => s.skillName.toLowerCase()))

  const calcFit = (preferred: string[], bonusCondition: boolean) => {
    const matched = preferred.filter((p) => skillNames.has(p.toLowerCase()))
    const base = preferred.length > 0 ? (matched.length / preferred.length) * 80 : 50
    const bonus = bonusCondition ? 15 : 0
    return Math.min(95, Math.max(40, Math.round(base + bonus)))
  }

  const aiFit = calcFit(['python', 'machine learning', 'pytorch', 'fastapi'], preferences.problemType === 'ai_algorithms')
  const fullstackFit = calcFit(['react', 'typescript', 'javascript', 'sql'], preferences.problemType === 'building_products')
  const dataFit = calcFit(['sql', 'python', 'pandas', 'statistics'], preferences.problemType === 'data_insights')
  const devopsFit = calcFit(['docker', 'linux', 'git', 'ci/cd'], preferences.problemType === 'systems_infra')

  const careerRoles = [
    {
      title: 'AI / Machine Learning Engineer',
      fit: aiFit,
      tag: aiFit >= 80 ? 'Highest Alignment' : 'Developing Track',
      rationale:
        skills.some((s) => s.category === 'ai_ml' || s.skillName.toLowerCase() === 'python')
          ? 'Your verified Python and AI/ML evidence provides strong grounding for machine learning pipelines and intelligent agent design.'
          : 'Interest in intelligent systems. Adding practical projects in model integration and Python APIs will rapidly increase readiness.',
      strengths: skills.filter((s) => ['python', 'machine learning', 'pytorch'].includes(s.skillName.toLowerCase())).map((s) => s.skillName).concat(['API orchestration']).slice(0, 3),
      nextSteps: ['Master PyTorch tensors', 'Study transformer attention mechanisms'],
    },
    {
      title: 'Full-Stack Software Engineer',
      fit: fullstackFit,
      tag: fullstackFit >= 80 ? 'Immediate Readiness' : 'Developing Track',
      rationale:
        skills.some((s) => s.category === 'frontend' || s.skillName.toLowerCase() === 'react')
          ? 'Demonstrated component architecture and client-facing engineering combined with structured APIs creates direct suitability for web product teams.'
          : 'Building modern responsive web applications with TypeScript and clean state management makes you a strong generalist candidate.',
      strengths: skills.filter((s) => ['react', 'typescript', 'sql', 'javascript'].includes(s.skillName.toLowerCase())).map((s) => s.skillName).concat(['UI design']).slice(0, 3),
      nextSteps: ['Learn Next.js server actions', 'PostgreSQL indexing and schema optimization'],
    },
    {
      title: 'Data Science & Analytics Intern',
      fit: dataFit,
      tag: dataFit >= 70 ? 'Strong Fit' : 'Addressable Gap',
      rationale:
        skills.some((s) => s.skillName.toLowerCase() === 'sql')
          ? 'Solid database querying intuition and analytical reasoning. Would benefit from dedicated exploratory data analysis portfolio projects.'
          : 'Focuses on transforming unstructured data into actionable decision models. Requires expanding SQL and data visualization evidence.',
      strengths: skills.filter((s) => ['sql', 'python'].includes(s.skillName.toLowerCase())).map((s) => s.skillName).concat(['Exploratory analysis']).slice(0, 3),
      nextSteps: ['Pandas & NumPy data manipulation', 'A/B test evaluation & metrics design'],
    },
    {
      title: 'DevOps & Cloud Systems Intern',
      fit: devopsFit,
      tag: devopsFit >= 70 ? 'Strong Fit' : 'Secondary Direction',
      rationale:
        'Focuses on deployment reliability, CI/CD pipelines, container orchestration, and cloud infrastructure monitoring.',
      strengths: ['Automation scripting', 'Version control', 'System architecture'],
      nextSteps: ['Docker container orchestration', 'GitHub Actions workflow automation'],
    },
  ]

  const handleCompute = () => {
    setHasCalculated(true)
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="pb-6 border-b border-slate-200">
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 mb-1">
          <Compass className="w-3.5 h-3.5" />
          <span>Career Direction Signals</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Discover Your Optimal Internship Path
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Unsure which internships you should target? Answer 4 quick preference signals to evaluate
          your alignment across core engineering tracks.
        </p>
      </div>

      {/* Discovery Input Form */}
      <div className="p-6 sm:p-8 rounded-3xl border border-slate-200 bg-white shadow-xs space-y-6">
        <h3 className="text-sm font-bold text-slate-900">Your Engineering & Problem-Solving Preferences</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              1. What type of problems excite you most?
            </label>
            <select
              value={preferences.problemType}
              onChange={(e) => setPreferences({ ...preferences, problemType: e.target.value })}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-indigo-500 cursor-pointer"
            >
              <option value="building_products">Building interactive user-facing applications</option>
              <option value="ai_algorithms">Training models, vector search, and intelligent agents</option>
              <option value="data_insights">Extracting insights and patterns from large datasets</option>
              <option value="systems_infra">Cloud infrastructure, pipelines, and performance</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              2. Preferred coding & architecture focus
            </label>
            <select
              value={preferences.codePreference}
              onChange={(e) => setPreferences({ ...preferences, codePreference: e.target.value })}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-indigo-500 cursor-pointer"
            >
              <option value="deep_logic">Python backend APIs and model pipelines</option>
              <option value="ui_ux">React, TypeScript, component design systems</option>
              <option value="sql_etl">SQL queries, data transformations, analytics</option>
              <option value="devops">Containers, CI/CD, automation scripts</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              3. Deliverable you are most proud of
            </label>
            <select
              value={preferences.dataStyle}
              onChange={(e) => setPreferences({ ...preferences, dataStyle: e.target.value })}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-indigo-500 cursor-pointer"
            >
              <option value="interactive_apps">An AI assistant or automation script that saves time</option>
              <option value="web_product">A polished responsive website used by peers</option>
              <option value="dataset_model">A machine learning model or analytical dashboard</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              4. Ideal team & company environment
            </label>
            <select
              value={preferences.teamStyle}
              onChange={(e) => setPreferences({ ...preferences, teamStyle: e.target.value })}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-indigo-500 cursor-pointer"
            >
              <option value="fast_paced_startups">Fast-moving AI startups with high autonomy</option>
              <option value="scaleup">Mid-sized SaaS product company with strong mentorship</option>
              <option value="enterprise">Established tech enterprise with structured rotational co-ops</option>
            </select>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <Button size="md" onClick={handleCompute} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">
            <Sparkles className="w-4 h-4 mr-1.5" />
            <span>Generate Career Direction Signals</span>
          </Button>
        </div>
      </div>

      {/* Results View */}
      {hasCalculated && (
        <div className="space-y-4 animate-in fade-in">
          <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-100 text-xs text-indigo-950 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>
              <strong>Note:</strong> Career Direction Signals reflect your current project evidence and stated preferences. They are guidance tools, not clinical assessments.
            </span>
          </div>

          <div className="space-y-4">
            {careerRoles.map((role) => (
              <div
                key={role.title}
                className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-base font-bold text-slate-900">{role.title}</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {role.tag}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">{role.rationale}</p>

                  <div className="pt-1 flex flex-wrap gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 font-medium">Core Strengths: </span>
                      <span className="font-semibold text-slate-700">
                        {role.strengths.join(', ')}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">High-Impact Next Step: </span>
                      <span className="font-semibold text-indigo-600">
                        {role.nextSteps.join(', ')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0 self-end md:self-auto">
                  <ScoreRing score={role.fit} size="sm" showLabel={false} />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate('/opportunities')}
                    className="text-xs"
                  >
                    <span>View Matching Roles</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
