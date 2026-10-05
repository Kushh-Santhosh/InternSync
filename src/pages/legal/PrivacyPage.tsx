import React from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, Shield, ArrowLeft } from 'lucide-react'

export const PrivacyPage: React.FC = () => {
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
          <h1 className="text-2xl font-bold tracking-tight">Privacy Policy</h1>
        </div>
        <p className="text-xs text-slate-500">Effective Date: October 2026 • Version 2.4</p>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6 text-xs text-slate-600 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-600" />
            1. Evidence-Based Confidentiality
          </h2>
          <p>
            InternSync is designed specifically for students and educational ecosystems. Your uploaded resumes, project presentations (PPT/PPTX), research reports, and certificates are parsed solely for the purpose of deriving your personal Career DNA and calculating deterministic opportunity fit.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-slate-900">2. Untrusted Content Isolation</h2>
          <p>
            All external job listings and third-party documents are treated as untrusted data inputs. We strictly isolate web content and enforce sanitization barriers to guard against unauthorized access, prompt injection, and credential theft.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-slate-900">3. GitHub Permissions</h2>
          <p>
            When you optionally connect your GitHub account, InternSync requests strictly read-only access to inspect repository programming languages and topics to substantiate your project evidence. We never request or perform code commits, issues, or write modifications.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-slate-900">4. Data Deletion & Export</h2>
          <p>
            You have full ownership of your data. You may delete your uploaded documents, reset your Career DNA, or remove your account at any time directly through your settings.
          </p>
        </section>
      </div>
    </div>
  )
}
