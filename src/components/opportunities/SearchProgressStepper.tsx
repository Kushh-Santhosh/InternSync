import React from 'react'
import {
  CheckCircle2,
  Clock,
  RefreshCw,
  AlertTriangle,
  X,
  Sparkles,
  Search,
  Building2,
  ShieldCheck,
  Cpu,
} from 'lucide-react'
import type { LiveSearchProgress } from '@/types'
import { cn } from '@/lib/utils/cn'

export interface SearchProgressStepperProps {
  progress: LiveSearchProgress
  onDismiss: () => void
}

interface StepDef {
  key: string
  label: string
  detail: string
  icon: React.ElementType
}

const STEPS: StepDef[] = [
  {
    key: 'profile',
    label: 'Understanding Profile',
    detail: 'Analyzing Career DNA, confirmed skills, and projects',
    icon: Sparkles,
  },
  {
    key: 'queries',
    label: 'Query Planning',
    detail: 'Generating multi-vector search queries from target role',
    icon: Search,
  },
  {
    key: 'ats_sources',
    label: 'Checking ATS Feeds',
    detail: 'Querying Greenhouse, Lever, and Ashby live boards',
    icon: Building2,
  },
  {
    key: 'verifying',
    label: 'Verifying Postings',
    detail: 'Filtering stale titles & checking direct portal safety',
    icon: ShieldCheck,
  },
  {
    key: 'scoring',
    label: 'Comparing Requirements',
    detail: 'Evaluating deterministic 8-factor fit and skill gaps',
    icon: Cpu,
  },
  {
    key: 'recommendations',
    label: 'Recommendations Ready',
    detail: 'Synthesizing Apply Now, Prepare First, and Skip guidance',
    icon: CheckCircle2,
  },
]

export const SearchProgressStepper: React.FC<SearchProgressStepperProps> = ({ progress, onDismiss }) => {
  if (progress.stage === 'idle') return null

  if (progress.stage === 'error') {
    return (
      <div className="p-5 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-950 space-y-3 animate-fadeIn">
        <div className="flex items-center justify-between">
          <span className="font-bold text-sm flex items-center gap-2 text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Search & Source Notice</span>
          </span>
          <button
            onClick={onDismiss}
            className="text-xs font-semibold text-amber-700 hover:text-amber-900 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
        <p className="text-xs text-amber-800 leading-relaxed font-medium">
          {progress.message}
        </p>
      </div>
    )
  }

  // Determine which step is currently active (0 to 5)
  let activeStepIndex = 0
  if (progress.stage === 'reading_dna') activeStepIndex = 0
  else if (progress.stage === 'generating_queries') activeStepIndex = 1
  else if (progress.stage === 'searching_web' || progress.stage === 'checking_apis') activeStepIndex = 2
  else if (progress.stage === 'deduplicating' || progress.stage === 'extracting_requirements') activeStepIndex = 3
  else if (progress.stage === 'matching') activeStepIndex = 4
  else if (progress.stage === 'completed') activeStepIndex = 6

  const isCompleted = progress.stage === 'completed'

  return (
    <div className="p-5 rounded-2xl bg-white border border-indigo-100 shadow-xs space-y-4 animate-fadeIn">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          {isCompleted ? (
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          ) : (
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-200">
              <RefreshCw className="w-4 h-4 animate-spin" />
            </div>
          )}
          <div>
            <h4 className="text-xs font-bold text-slate-900">
              {isCompleted ? 'Discovery Completed' : 'Deep Opportunity Research in Progress'}
            </h4>
            <p className="text-[11px] text-slate-500">{progress.message}</p>
          </div>
        </div>

        {isCompleted && (
          <button
            onClick={onDismiss}
            className="text-xs font-semibold text-slate-400 hover:text-slate-700 cursor-pointer p-1"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 6-Stage Progress Stepper */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {STEPS.map((step, idx) => {
          const isDone = isCompleted || activeStepIndex > idx
          const isCurrent = !isCompleted && activeStepIndex === idx
          const isPending = !isCompleted && activeStepIndex < idx
          const Icon = step.icon

          return (
            <div
              key={step.key}
              className={cn(
                'p-2.5 rounded-xl border text-xs transition-all flex flex-col justify-between min-h-[72px]',
                isDone
                  ? 'border-emerald-200 bg-emerald-50/40 text-emerald-950'
                  : isCurrent
                    ? 'border-indigo-400 bg-indigo-50/70 text-indigo-950 ring-2 ring-indigo-50'
                    : 'border-slate-100 bg-slate-50/50 text-slate-400 opacity-60'
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Icon
                    className={cn(
                      'w-3.5 h-3.5',
                      isDone ? 'text-emerald-600' : isCurrent ? 'text-indigo-600' : 'text-slate-400'
                    )}
                  />
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    {idx + 1}. {step.label}
                  </span>
                </div>
                {isDone ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                ) : isCurrent ? (
                  <RefreshCw className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
                ) : (
                  <Clock className="w-3 h-3 text-slate-300" />
                )}
              </div>
              <span className="text-[10px] text-slate-500 leading-tight mt-1">
                {step.detail}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
