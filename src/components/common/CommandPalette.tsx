import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BrainCircuit,
  Briefcase,
  FileText,
  KanbanSquare,
  MessageSquare,
  Search,
  Sparkles,
  X,
} from 'lucide-react'
import { useApp } from '@/app/context'

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate()
  const { opportunities } = useApp()
  const [query, setQuery] = useState('')

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (isOpen) onClose()
        else {
          // handled by parent or toggle
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const actions = [
    {
      id: 'nav-dashboard',
      icon: Sparkles,
      label: 'Open Dashboard',
      category: 'Navigation',
      action: () => {
        navigate('/dashboard')
        onClose()
      },
    },
    {
      id: 'cmd-search-internships',
      icon: Briefcase,
      label: 'Search internships',
      category: 'Opportunities',
      action: () => {
        navigate('/opportunities')
        onClose()
      },
    },
    {
      id: 'cmd-open-career-dna',
      icon: BrainCircuit,
      label: 'Open Career DNA',
      category: 'Profile & Skills',
      action: () => {
        navigate('/career-dna')
        onClose()
      },
    },
    {
      id: 'cmd-start-skill-lab',
      icon: FileText,
      label: 'Start Skill Lab',
      category: 'Assessments',
      action: () => {
        navigate('/skill-lab')
        onClose()
      },
    },
    {
      id: 'cmd-upload-resume',
      icon: Sparkles,
      label: 'Upload Resume',
      category: 'Ingestion',
      action: () => {
        navigate('/onboarding')
        onClose()
      },
    },
    {
      id: 'cmd-open-applications',
      icon: KanbanSquare,
      label: 'Open Applications (Kanban)',
      category: 'Tracking',
      action: () => {
        navigate('/applications')
        onClose()
      },
    },
    {
      id: 'cmd-ask-assistant',
      icon: MessageSquare,
      label: 'Ask AI Assistant',
      category: 'Advisory',
      action: () => {
        navigate('/assistant')
        onClose()
      },
    },
  ]

  // Filter actions or matching opportunities
  const filteredActions = actions.filter((a) =>
    a.label.toLowerCase().includes(query.toLowerCase())
  )

  const matchingOpportunities = query.trim()
    ? opportunities
        .filter(
          (o) =>
            o.roleTitle.toLowerCase().includes(query.toLowerCase()) ||
            o.companyName.toLowerCase().includes(query.toLowerCase()) ||
            o.requiredSkills.some((s) => s.toLowerCase().includes(query.toLowerCase()))
        )
        .slice(0, 4)
    : []

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Palette Container */}
      <div className="relative w-full max-w-xl rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-100">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-100">
          <Search className="w-5 h-5 text-slate-400 mr-3 shrink-0" />
          <input
            autoFocus
            type="text"
            placeholder="Type a command, skill, or internship..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full text-sm bg-transparent outline-none placeholder:text-slate-400 text-slate-900"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block text-[10px] font-semibold text-slate-400 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded ml-2">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2">
          {matchingOpportunities.length > 0 && (
            <div className="mb-2">
              <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Matching Opportunities
              </div>
              {matchingOpportunities.map((opp) => (
                <div
                  key={opp.id}
                  onClick={() => {
                    navigate(`/opportunities/${opp.id}`)
                    onClose()
                  }}
                  className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <img
                      src={opp.companyLogo}
                      alt={opp.companyName}
                      className="w-6 h-6 rounded-md object-cover border border-slate-200"
                    />
                    <div>
                      <div className="text-xs font-semibold text-slate-900">{opp.roleTitle}</div>
                      <div className="text-[11px] text-slate-500">{opp.companyName} · {opp.location}</div>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                    View
                  </span>
                </div>
              ))}
            </div>
          )}

          <div>
            <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Commands & Quick Navigation
            </div>
            {filteredActions.length === 0 && matchingOpportunities.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No matching actions or opportunities found.
              </div>
            ) : (
              filteredActions.map((action) => {
                const Icon = action.icon
                return (
                  <button
                    key={action.id}
                    onClick={action.action}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-indigo-50/70 group text-left cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-md bg-slate-100 group-hover:bg-indigo-100 text-slate-600 group-hover:text-indigo-600 transition-colors">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-medium text-slate-800 group-hover:text-indigo-900">
                        {action.label}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 bg-slate-50 group-hover:bg-indigo-100/50 px-2 py-0.5 rounded">
                      {action.category}
                    </span>
                  </button>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
