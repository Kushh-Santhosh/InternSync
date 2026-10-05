import React from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, FileText, ArrowLeft } from 'lucide-react'

export const TermsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#fafbfc] text-slate-900 selection:bg-indigo-100 selection:text-indigo-900 py-16 px-6 sm:px-12 max-w-4xl mx-auto">
      <div className="mb-10">
        <Link to="/" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 mb-6 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to InternSync
        </Link>
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs">
            <Sparkles className="w-4 h-4 fill-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Terms of Service</h1>
        </div>
        <p className="text-xs text-slate-500">Effective Date: October 2026 • Version 2.4</p>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6 text-xs text-slate-600 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-600" />
            1. Opportunity Readiness Engine
          </h2>
          <p>
            InternSync provides transparent, deterministic readiness scores and skill gap analysis to help students prepare for and apply to internships. Match scores and recommendations (APPLY NOW, PREPARE FIRST, SKIP) are evaluative indicators calculated from your uploaded evidence and public job listings.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-slate-900">2. External Application Portals</h2>
          <p>
            Direct application URLs link directly to official employer career portals (e.g. Greenhouse, Lever, Workday, or company career domains). Applications are submitted by the student directly to employers; InternSync does not impersonate candidates or guarantee internship hiring outcomes.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-slate-900">3. User Responsibility & Accurate Evidence</h2>
          <p>
            Users agree to upload legitimate, non-malicious documents representing their academic history and projects. Uploading copyrighted, malicious, or intentionally fraudulent material is strictly prohibited.
          </p>
        </section>
      </div>
    </div>
  )
}
