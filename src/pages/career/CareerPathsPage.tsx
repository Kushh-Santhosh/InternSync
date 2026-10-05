import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Compass,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ScoreRing } from '@/components/ui/ScoreRing'

export const CareerPathsPage: React.FC = () => {
  const navigate = useNavigate()
  const [preferences, setPreferences] = useState({
    problemType: 'building_products',
    codePreference: 'deep_logic',
    dataStyle: 'interactive_apps',
    teamStyle: 'fast_paced_startups',
  })

  const [hasCalculated, setHasCalculated] = useState(false)

  const careerRoles = [
    {
      title: 'AI / Machine Learning Engineer',
      fit: 91,
      tag: 'Highest Alignment',
      rationale:
        'Your demonstrated project work with FastAPI vector search, facial embeddings, and Python creates immediate affinity for junior AI infrastructure and model integration.',
      strengths: ['Python backend execution', 'Vector embeddings', 'API orchestration'],
      nextSteps: ['Master PyTorch tensors', 'Study transformer attention mechanisms'],
    },
    {
      title: 'Full-Stack Software Engineer',
      fit: 86,
      tag: 'Immediate Readiness',
      rationale:
        'Strong React, TypeScript, and modern component architecture combined with relational database design makes you a competitive candidate for client-facing software teams.',
      strengths: ['React & Tailwind UI design', 'TypeScript types', 'REST APIs'],
      nextSteps: ['Learn Next.js 15 server actions', 'PostgreSQL index profiling'],
    },
    {
      title: 'Data Science & Analytics Intern',
      fit: 74,
      tag: 'Addressable Gap',
      rationale:
        'Solid database intuition and Python foundation; would benefit from dedicated exploratory data analysis (EDA) and Pandas statistical portfolio pieces.',
      strengths: ['SQL queries', 'Basic statistics', 'Python scripting'],
      nextSteps: ['Pandas & NumPy data manipulation', 'A/B test evaluation'],
    },
    {
      title: 'Associate Technical Product Manager',
      fit: 65,
      tag: 'Secondary Direction',
      rationale:
        'High empathy for developer tooling and end-user UX. Requires building evidence around feature specification and product analytics funnels.',
      strengths: ['Technical communication', 'Product empathy'],
      nextSteps: ['Write structured PRDs', 'Learn PostHog product telemetry'],
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
