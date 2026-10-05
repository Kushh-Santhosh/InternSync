import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  FileText,
  Presentation,
  Award,
  ExternalLink,
  Brain,
  Search,
  Target,
  Clock,
  Layers,
  BarChart3,
  Menu,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { InternSyncLogo } from '@/components/brand/InternSyncLogo'
import { ResumeUploadCard } from '@/components/resume/ResumeUploadCard'

const GithubIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
    />
  </svg>
)

export const LandingPage: React.FC = () => {
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#fafbfc] text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      {/* 1. Public Sticky Navbar */}
      <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-slate-200/80 transition-all">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 h-20 flex items-center justify-between">
          <InternSyncLogo variant="full" size="md" to="/" />

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#how-it-works" className="hover:text-indigo-600 transition-colors">
              How it works
            </a>
            <a href="#pipeline" className="hover:text-indigo-600 transition-colors">
              Readiness Pipeline
            </a>
            <a href="#evidence" className="hover:text-indigo-600 transition-colors">
              Evidence Ingestion
            </a>
            <a href="#live-discovery" className="hover:text-indigo-600 transition-colors">
              Live Discovery
            </a>
          </nav>

          {/* Action CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/login"
              className="text-xs font-semibold text-slate-700 hover:text-slate-900 px-3.5 py-2 rounded-xl hover:bg-slate-100 transition-all"
            >
              Sign in
            </Link>
            <Button
              onClick={() => navigate('/signup')}
              className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs cursor-pointer"
            >
              <span>Get started</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </div>

          {/* Mobile Menu Trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-slate-200 bg-white px-6 py-5 space-y-4 shadow-lg">
            <div className="flex flex-col space-y-3 text-sm font-medium text-slate-700">
              <a
                href="#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-indigo-600"
              >
                How it works
              </a>
              <a
                href="#pipeline"
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-indigo-600"
              >
                Readiness Pipeline
              </a>
              <a
                href="#evidence"
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-indigo-600"
              >
                Evidence Ingestion
              </a>
              <a
                href="#live-discovery"
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-indigo-600"
              >
                Live Discovery
              </a>
            </div>
            <div className="pt-4 border-t border-slate-100 flex flex-col gap-2.5">
              <Link
                to="/login"
                className="w-full text-center py-2.5 text-xs font-semibold text-slate-700 border border-slate-200 rounded-xl"
              >
                Sign in
              </Link>
              <Button
                onClick={() => navigate('/signup')}
                className="w-full py-2.5 bg-slate-900 text-white text-xs font-semibold rounded-xl"
              >
                Get started
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* 2. Hero Section */}
      <section className="relative pt-20 pb-24 px-6 sm:px-10 max-w-7xl mx-auto text-center">
        {/* Decorative ambient gradients */}
        <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-indigo-100/60 via-purple-100/40 to-transparent rounded-full blur-3xl -z-10 pointer-events-none" />

        {/* Trust Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 shadow-xs text-slate-600 text-xs font-semibold mb-8">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>AI-powered • Evidence-based • Transparent</span>
        </div>

        {/* Hero Headline */}
        <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight text-slate-900 max-w-4xl mx-auto leading-[1.08]">
          Stop applying{' '}
          <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
            blindly.
          </span>
        </h1>

        {/* Supporting Copy */}
        <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto mt-6 leading-relaxed font-normal">
          InternSync understands your profile, searches live internship opportunities, explains your
          fit, finds your skill gaps, and tells you what to do next.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mt-8 mb-12">
          <a
            href="#resume-upload"
            className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-2xl shadow-lg shadow-indigo-600/20 transition-all hover:scale-[1.02] flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Upload my resume</span>
            <ArrowRight className="w-4 h-4" />
          </a>
          <a
            href="#pipeline"
            className="w-full sm:w-auto px-7 py-3.5 text-sm font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl shadow-xs transition-all text-center cursor-pointer"
          >
            Explore InternSync
          </a>
        </div>

        {/* Core Product Action: Prominent Resume Upload Card */}
        <div id="resume-upload" className="max-w-3xl mx-auto scroll-mt-28 mb-16 text-left">
          <ResumeUploadCard />
        </div>

        {/* 3. Hero Product Visualization Card: The 5-Step Pipeline */}
        <div id="pipeline" className="max-w-5xl mx-auto text-left scroll-mt-28">
          <div className="relative rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-8 shadow-2xl shadow-slate-200/70 overflow-hidden">
            {/* Window bar */}
            <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-slate-200" />
                <div className="w-3 h-3 rounded-full bg-slate-200" />
                <div className="w-3 h-3 rounded-full bg-slate-200" />
                <span className="ml-2 text-xs font-mono text-slate-400">
                  pipeline: opportunity_readiness_engine
                </span>
              </div>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                Deterministic 8-Factor Match
              </span>
            </div>

            {/* Architecture Pipeline Visual: RESUME → CAREER DNA → LIVE OPPORTUNITIES → MATCH SCORE → APPLY / PREPARE / SKIP */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center">
              {/* Box 1: Resume */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                  Step 01
                </span>
                <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-indigo-600" />
                  Resume
                </div>
                <div className="text-[11px] text-slate-500 leading-snug">
                  PDF, DOCX, PPT, TXT, GitHub
                </div>
              </div>

              {/* Box 2: Career DNA */}
              <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-200/70 space-y-1.5">
                <span className="text-[10px] font-bold tracking-wider text-indigo-500 uppercase">
                  Step 02
                </span>
                <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <Brain className="w-3.5 h-3.5 text-indigo-600" />
                  Career DNA
                </div>
                <div className="text-[11px] text-slate-600 space-y-0.5">
                  <div>Python • React • SQL</div>
                  <div className="text-[10px] text-indigo-600 font-semibold">Evidence validated</div>
                </div>
              </div>

              {/* Box 3: Live Opportunities */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                  Step 03
                </span>
                <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5 text-indigo-600" />
                  Live Opps
                </div>
                <div className="text-[11px] text-slate-500 leading-snug">
                  Greenhouse, Lever, Portals
                </div>
              </div>

              {/* Box 4: Match Score */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                  Step 04
                </span>
                <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-indigo-600" />
                  Match Score
                </div>
                <div className="text-[11px] text-slate-500 leading-snug">
                  8-factor weighted rubric
                </div>
              </div>

              {/* Box 5: Decision Card */}
              <div className="p-3.5 rounded-2xl bg-white border-2 border-emerald-500/50 shadow-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    APPLY NOW
                  </span>
                  <span className="text-sm font-extrabold text-slate-900">91%</span>
                </div>
                <div className="text-xs font-bold text-slate-900 leading-tight">
                  Direct Apply
                  <span className="block text-[10px] font-normal text-slate-500">Verified links</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. The Problem Section */}
      <section className="py-24 bg-white border-y border-slate-200/80 px-6 sm:px-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              The problem isn't finding internships.
            </h2>
            <p className="mt-3 text-lg text-slate-600">
              It's knowing which ones are actually worth your time.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* The Old Way */}
            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200/80 space-y-5">
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
                The Blind Application Trap
              </div>
              <div className="text-3xl font-extrabold text-slate-900">
                126 opportunities found
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                You scroll through dozens of generic job listings without answers to critical questions:
              </p>
              <ul className="space-y-2.5 text-xs text-slate-600">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                  <span>Am I genuinely eligible for this year and degree?</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                  <span>Do I actually match the required engineering stack?</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                  <span>What skills am I missing before I apply?</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                  <span>Should I apply now, prepare first, or skip?</span>
                </li>
              </ul>
            </div>

            {/* The InternSync Way */}
            <div className="p-8 rounded-3xl bg-gradient-to-br from-indigo-900 to-slate-900 text-white shadow-xl space-y-6">
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-800">
                InternSync Opportunity Intelligence
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-300 pb-2 border-b border-slate-800">
                  <span>126 discovered on live web</span>
                  <span className="font-semibold text-slate-100">Step 1: Fan-out</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-300 pb-2 border-b border-slate-800">
                  <span>43 relevant after deduplication</span>
                  <span className="font-semibold text-slate-100">Step 2: Clean</span>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-2">
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                    <span className="text-lg font-black text-emerald-400 block">12</span>
                    <span className="text-[10px] font-bold text-emerald-300 uppercase">Apply Now</span>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                    <span className="text-lg font-black text-amber-400 block">8</span>
                    <span className="text-[10px] font-bold text-amber-300 uppercase">Prepare</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-500/10 border border-slate-500/20 text-center">
                    <span className="text-lg font-black text-slate-400 block">23</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Skip</span>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed italic">
                * Conceptual product pipeline: InternSync replaces guesswork with deterministic clarity.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. How It Works (5 Steps) */}
      <section id="how-it-works" className="py-24 px-6 sm:px-10 max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
            System Architecture
          </span>
          <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            How InternSync works
          </h2>
          <p className="mt-2 text-slate-600 text-sm">
            From raw student evidence to verified employer application links in five transparent stages.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[
            {
              step: '01',
              title: 'Understand me',
              desc: 'Upload your resume, PPT project decks, reports, and certificates.',
              icon: FileText,
            },
            {
              step: '02',
              title: 'Build Career DNA',
              desc: 'Synthesizes education, verified skills, and optional GitHub code.',
              icon: Brain,
            },
            {
              step: '03',
              title: 'Search live web',
              desc: 'Queries company career portals and configured job feeds in real-time.',
              icon: Search,
            },
            {
              step: '04',
              title: 'Explain fit',
              desc: 'Deterministic 8-factor score reveals exact matches and missing skills.',
              icon: BarChart3,
            },
            {
              step: '05',
              title: 'Take action',
              desc: 'Apply directly through employer portals or follow a 14-day prep sprint.',
              icon: Target,
            },
          ].map((item) => (
            <div
              key={item.step}
              className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:border-indigo-300 transition-all space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-indigo-600 font-mono">{item.step}</span>
                <item.icon className="w-4 h-4 text-slate-400" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 6. Upload Anything / Evidence Ingestion Section */}
      <section id="evidence" className="py-24 bg-slate-900 text-white px-6 sm:px-10">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-950 px-3 py-1 rounded-full border border-indigo-800">
                Multi-Source Intelligence
              </span>
              <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
                Your resume is only part of your story.
              </h2>
              <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
                InternSync turns your real, existing work into substantiated proof. Instead of relying on self-declared keywords, we parse slide deck architectures, GitHub repos, and test validations.
              </p>

              {/* Upload Evidence Chips */}
              <div className="flex flex-wrap gap-2 pt-2">
                {[
                  { label: 'PDF Resumes', icon: FileText },
                  { label: 'Project PPT/PPTX', icon: Presentation },
                  { label: 'Technical Reports', icon: Layers },
                  { label: 'Course Certificates', icon: Award },
                  { label: 'GitHub Repositories', icon: GithubIcon },
                ].map((chip) => (
                  <div
                    key={chip.label}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200"
                  >
                    <chip.icon className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{chip.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Evidence Breakdown Card */}
            <div className="bg-slate-800/90 rounded-3xl p-6 sm:p-8 border border-slate-700/80 shadow-2xl space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Evidence Substantiation
              </h4>
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-indigo-400" />
                    <div>
                      <div className="text-xs font-bold text-white">Resume Parsing</div>
                      <div className="text-[11px] text-slate-400">Extracts degrees, dates, declared skills</div>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-semibold text-emerald-400">Baseline</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Presentation className="w-4 h-4 text-purple-400" />
                    <div>
                      <div className="text-xs font-bold text-white">PPT/PPTX Slide Ingestion</div>
                      <div className="text-[11px] text-slate-400">Extracts system diagrams & project architecture</div>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-semibold text-indigo-400">+15% Boost</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <GithubIcon className="w-4 h-4 text-slate-300" />
                    <div>
                      <div className="text-xs font-bold text-white">GitHub Read-Only Sync</div>
                      <div className="text-[11px] text-slate-400">Inspects language distribution & repo topics</div>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-semibold text-indigo-400">+10% Boost</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 italic pt-2">
                "Not just what you claim. What your evidence supports."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Career DNA & Readiness Section */}
      <section id="readiness" className="py-24 px-6 sm:px-10 max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Differentiator
          </span>
          <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            APPLY NOW • PREPARE FIRST • SKIP
          </h2>
          <p className="mt-2 text-slate-600 text-sm">
            Every recommendation comes with an explainable reason. Never apply to an internship you don't understand.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Apply Now */}
          <div className="p-6 rounded-3xl bg-white border-2 border-emerald-500/50 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800">
                APPLY NOW
              </span>
              <span className="text-xs font-bold text-emerald-600">Score &ge; 80%</span>
            </div>
            <h3 className="text-base font-bold text-slate-900">"You're ready."</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Your verified skills cover all core job requirements, you satisfy year and degree criteria, and you have solid project evidence.
            </p>
            <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-100 text-[11px] text-emerald-800 font-medium space-y-1">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Eligibility fully verified</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Primary skills substantiated</span>
              </div>
            </div>
          </div>

          {/* Card 2: Prepare First */}
          <div className="p-6 rounded-3xl bg-white border-2 border-amber-500/50 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-amber-100 text-amber-800">
                PREPARE FIRST
              </span>
              <span className="text-xs font-bold text-amber-600">Score 60% – 79%</span>
            </div>
            <h3 className="text-base font-bold text-slate-900">"You're close."</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              You match the core stack, but miss 1–2 learnable tools. InternSync generates a 14-day sprint roadmap so you can bridge the gap before applying.
            </p>
            <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-100 text-[11px] text-amber-800 font-medium space-y-1">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>14-day sprint generated</span>
              </div>
              <div className="flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                <span>Identifies 1–2 targeted gaps</span>
              </div>
            </div>
          </div>

          {/* Card 3: Skip */}
          <div className="p-6 rounded-3xl bg-white border-2 border-slate-300 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-slate-100 text-slate-700">
                SKIP
              </span>
              <span className="text-xs font-bold text-slate-500">Mismatched</span>
            </div>
            <h3 className="text-base font-bold text-slate-900">"Not a fit right now."</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Hard constraints failed (e.g. required 4th year when you are 2nd year, or heavy backend requirement when you specialize in frontend). Don't waste your time.
            </p>
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 font-medium space-y-1">
              <div>• Saves your application energy</div>
              <div>• Prevents silent ghosting</div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Live Web Discovery Visualization */}
      <section id="live-discovery" className="py-24 bg-white border-y border-slate-200/80 px-6 sm:px-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
              Live Opportunity Intelligence
            </span>
            <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Don't search harder. Search smarter.
            </h2>
            <p className="mt-2 text-slate-600 text-sm">
              Live web searches through OpenRouter and verified job feeds return real application links straight from official employer domains.
            </p>
          </div>

          {/* Opportunity Product Visual Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Visual Card 1 */}
            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80 hover:bg-white hover:shadow-lg transition-all space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  APPLY NOW • 91% Match
                </span>
                <span className="text-[11px] font-mono text-slate-400">Greenhouse ATS</span>
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">Machine Learning Intern</h4>
                <p className="text-xs text-slate-500">DeepScale Labs • Bengaluru • Hybrid</p>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-2 text-emerald-700">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Matches Python, Redis, and ML projects</span>
                </div>
                <div className="flex items-center gap-2 text-amber-700">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Gap: PyTorch deep learning depth</span>
                </div>
              </div>
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-mono text-[11px]">Source: greenhouse.io</span>
                <span className="font-bold text-indigo-600 flex items-center gap-1">
                  Apply directly <ExternalLink className="w-3 h-3" />
                </span>
              </div>
            </div>

            {/* Visual Card 2 */}
            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80 hover:bg-white hover:shadow-lg transition-all space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                  PREPARE FIRST • 74% Match
                </span>
                <span className="text-[11px] font-mono text-slate-400">Lever ATS</span>
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">Full Stack Systems Intern</h4>
                <p className="text-xs text-slate-500">CloudMatrix • Remote • India</p>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-2 text-emerald-700">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Matches React, TypeScript, and SQL</span>
                </div>
                <div className="flex items-center gap-2 text-amber-700">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Gap: Docker deployment pipeline</span>
                </div>
              </div>
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-mono text-[11px]">14-Day Sprint Available</span>
                <span className="font-bold text-indigo-600 flex items-center gap-1">
                  View listing <ExternalLink className="w-3 h-3" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. Final CTA */}
      <section className="py-24 px-6 sm:px-10 max-w-5xl mx-auto text-center">
        <div className="p-10 sm:p-16 rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight max-w-2xl mx-auto leading-tight">
            Stop applying everywhere. <br />
            Start applying where you fit.
          </h2>
          <p className="mt-4 text-slate-400 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Join students using evidence-based opportunity intelligence to find internships they actually qualify for.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              size="lg"
              onClick={() => navigate('/signup')}
              className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-600/20"
            >
              Build my Career DNA
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate('/opportunities')}
              className="w-full sm:w-auto px-7 py-3.5 text-sm font-semibold bg-white/10 hover:bg-white/20 text-white border-white/20 rounded-xl cursor-pointer"
            >
              Explore Live Opportunities
            </Button>
          </div>
        </div>
      </section>

      {/* 10. Minimal Clean Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-12 px-6 sm:px-10 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-2 space-y-3">
            <InternSyncLogo variant="full" size="sm" to="/" />
            <p className="text-slate-400 text-[11px] max-w-xs leading-relaxed">
              AI-powered internship opportunity-readiness platform. Built for students and academic ecosystems.
            </p>
            <p className="text-slate-400 text-[11px]">© 2026 InternSync. All rights reserved.</p>
          </div>

          <div>
            <h5 className="font-bold text-slate-900 mb-3">Product</h5>
            <ul className="space-y-2">
              <li>
                <a href="#how-it-works" className="hover:text-slate-900">
                  How it works
                </a>
              </li>
              <li>
                <a href="#readiness" className="hover:text-slate-900">
                  Readiness Engine
                </a>
              </li>
              <li>
                <a href="#live-discovery" className="hover:text-slate-900">
                  Live Discovery
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="font-bold text-slate-900 mb-3">Resources</h5>
            <ul className="space-y-2">
              <li>
                <Link to="/privacy" className="hover:text-slate-900">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-slate-900">
                  Terms of Service
                </Link>
              </li>
              <li>
                <a href="https://openrouter.ai" target="_blank" rel="noreferrer" className="hover:text-slate-900">
                  OpenRouter AI
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="font-bold text-slate-900 mb-3">Integrations</h5>
            <ul className="space-y-2">
              <li>
                <Link to="/settings" className="hover:text-slate-900">
                  OpenRouter Gateway
                </Link>
              </li>
              <li>
                <Link to="/settings" className="hover:text-slate-900">
                  Adzuna Jobs API
                </Link>
              </li>
              <li>
                <Link to="/settings" className="hover:text-slate-900">
                  GitHub OAuth
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  )
}
