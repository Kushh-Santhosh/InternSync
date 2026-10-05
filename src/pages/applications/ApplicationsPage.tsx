import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Clock,
  Edit3,
  KanbanSquare,
  Plus,
} from 'lucide-react'
import { useApp } from '@/app/context'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import type { ApplicationItem, ApplicationStatus } from '@/types'
import { cn } from '@/lib/utils/cn'

export const ApplicationsPage: React.FC = () => {
  const navigate = useNavigate()
  const { applications, updateApplicationStatus, updateApplicationNotes } = useApp()

  const [selectedApp, setSelectedApp] = useState<ApplicationItem | null>(null)
  const [editingNotes, setEditingNotes] = useState('')

  const columns: { id: ApplicationStatus; label: string; dot: string }[] = [
    { id: 'saved', label: 'Saved', dot: 'bg-slate-400' },
    { id: 'preparing', label: 'Preparing', dot: 'bg-amber-400' },
    { id: 'applied', label: 'Applied', dot: 'bg-indigo-500' },
    { id: 'assessment', label: 'Assessment', dot: 'bg-blue-500' },
    { id: 'interview', label: 'Interview', dot: 'bg-purple-500' },
    { id: 'offer', label: 'Offer', dot: 'bg-emerald-500' },
    { id: 'rejected', label: 'Archived / Rejected', dot: 'bg-slate-300' },
  ]

  const handleOpenEdit = (app: ApplicationItem) => {
    setSelectedApp(app)
    setEditingNotes(app.notes || '')
  }

  const handleSaveNotes = () => {
    if (selectedApp) {
      updateApplicationNotes(selectedApp.id, editingNotes)
      setSelectedApp(null)
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            YOUR APPLICATIONS
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track saved roles, application progress, and interview milestones.
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => navigate('/opportunities')}
          className="bg-indigo-600 hover:bg-indigo-700 text-white self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          <span>Explore Opportunities</span>
        </Button>
      </div>

      {applications.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white border border-slate-200/90 space-y-4 max-w-xl mx-auto my-8 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto shadow-2xs">
            <KanbanSquare className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">YOUR APPLICATIONS</h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Nothing here yet. When you save or apply to opportunities, they will automatically enter your tracker board.
          </p>
          <Button
            onClick={() => navigate('/opportunities')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow-xs"
          >
            <span>Find opportunities to apply</span>
          </Button>
        </div>
      ) : (
        /* Kanban Board Horizontal Scroll Container */
        <div className="flex gap-4 overflow-x-auto pb-6 min-h-[600px]">
        {columns.map((col) => {
          const colApps = applications.filter((a) => a.status === col.id)
          return (
            <div
              key={col.id}
              className="w-72 shrink-0 flex flex-col rounded-2xl bg-slate-100/70 border border-slate-200/80 p-3"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between px-2 py-1.5 mb-2">
                <div className="flex items-center gap-2">
                  <span className={cn('w-2 h-2 rounded-full', col.dot)} />
                  <span className="text-xs font-bold text-slate-800">{col.label}</span>
                </div>
                <span className="text-[11px] font-bold text-slate-400 bg-white border border-slate-200/80 px-1.5 py-0.2 rounded-md">
                  {colApps.length}
                </span>
              </div>

              {/* Column Cards Container */}
              <div className="flex-1 space-y-3 overflow-y-auto pr-0.5">
                {colApps.length === 0 ? (
                  <div className="py-10 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl bg-white/40">
                    No opportunities in {col.label.toLowerCase()}
                  </div>
                ) : (
                  colApps.map((app) => (
                    <div
                      key={app.id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between space-y-3"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[11px] font-semibold text-slate-500">
                              {app.opportunity.companyName}
                            </span>
                            <h4
                              onClick={() => navigate(`/opportunities/${app.opportunityId}`)}
                              className="text-xs font-bold text-slate-900 hover:text-indigo-600 transition-colors cursor-pointer leading-tight mt-0.5"
                            >
                              {app.opportunity.roleTitle}
                            </h4>
                          </div>

                          <span className="text-[11px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                            {app.matchScore}%
                          </span>
                        </div>

                        {/* Notes preview */}
                        {app.notes && (
                          <p className="text-[11px] text-slate-600 mt-2 bg-slate-50 p-2 rounded-lg border border-slate-100 leading-snug">
                            {app.notes}
                          </p>
                        )}

                        {/* Next Action Item */}
                        {app.nextAction && (
                          <div className="mt-2 text-[10px] text-indigo-700 font-medium flex items-center gap-1">
                            <Clock className="w-3 h-3 text-indigo-500" />
                            <span>{app.nextAction}</span>
                          </div>
                        )}
                      </div>

                      {/* Card Footer Controls: Stage Switcher */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <select
                          value={app.status}
                          onChange={(e) =>
                            updateApplicationStatus(app.id, e.target.value as ApplicationStatus)
                          }
                          className="text-[10px] font-medium bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-slate-700 cursor-pointer focus:outline-none"
                        >
                          {columns.map((c) => (
                            <option key={c.id} value={c.id}>
                              Move to {c.label}
                            </option>
                          ))}
                        </select>

                        <button
                          onClick={() => handleOpenEdit(app)}
                          className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-100 cursor-pointer"
                          title="Edit notes"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>
    )}

      {/* Edit Notes Modal */}
      <Modal
        isOpen={selectedApp !== null}
        onClose={() => setSelectedApp(null)}
        title={selectedApp ? `Notes for ${selectedApp.opportunity.roleTitle}` : ''}
        description={selectedApp ? selectedApp.opportunity.companyName : ''}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Application Notes & Interview Reflection
            </label>
            <textarea
              rows={4}
              value={editingNotes}
              onChange={(e) => setEditingNotes(e.target.value)}
              className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-indigo-500 font-sans"
              placeholder="e.g. Completed technical round. Focused on REST endpoints and React state."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setSelectedApp(null)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveNotes} className="bg-indigo-600 text-white">
              Save Notes
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
