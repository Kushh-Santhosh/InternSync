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
  Play,
  Database,
  Cpu,
  ShieldCheck,
  Compass,
  Sparkles,
  GitBranch,
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
    <div className="min-h-screen bg-[#fafbfc] text-[#010827] selection:bg-purple-100 selection:text-purple-900 font-sans">
      {/* 1. Public Sticky Header */}
      <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-slate-200/80 transition-all">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 h-20 flex items-center justify-between">
          <InternSyncLogo variant="full" size="md" to="/" />

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-7 text-xs font-semibold text-slate-600">
            <a href="#problem" className="hover:text-[#5D3FF3] transition-colors">
              The Problem
            </a>
            <a href="#gaps" className="hover:text-[#5D3FF3] transition-colors">
              The 4 Gaps
            </a>
            <a href="#pipeline" className="hover:text-[#5D3FF3] transition-colors">
              Readiness Pipeline
            </a>
            <a href="#dna" className="hover:text-[#5D3FF3] transition-colors">
              Career DNA
            </a>
            <a href="#live-discovery" className="hover:text-[#5D3FF3] transition-colors">
              Live Opportunities
            </a>
            <a href="#demo-video" className="hover:text-[#5D3FF3] transition-colors">
              Product Demo
            </a>
            <a href="#architecture" className="hover:text-[#5D3FF3] transition-colors">
              Architecture
            </a>
          </nav>

          {/* Action CTAs */}
          <div className="hidden sm:flex items-center gap-3">
            <a
              href="https://github.com/Kushh-Santhosh/InternSync"
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all"
              title="GitHub Repository"
            >
              <GithubIcon className="w-4 h-4" />
            </a>
            <Link
              to="/login"
              className="text-xs font-semibold text-slate-700 hover:text-slate-900 px-3.5 py-2 rounded-xl hover:bg-slate-100 transition-all"
            >
              Sign in
            </Link>
            <Button
              onClick={() => navigate('/signup')}
              className="bg-[#010827] hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-sm cursor-pointer"
            >
              <span>Get started</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </div>

          {/* Mobile Menu Trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-b border-slate-200 bg-white px-6 py-5 space-y-4 shadow-lg animate-in slide-in-from-top-2 duration-150">
            <div className="flex flex-col space-y-3 text-sm font-medium text-slate-700">
              <a href="#problem" onClick={() => setMobileMenuOpen(false)} className="hover:text-[#5D3FF3]">
                The Problem
              </a>
              <a href="#gaps" onClick={() => setMobileMenuOpen(false)} className="hover:text-[#5D3FF3]">
                The 4 Gaps
              </a>
              <a href="#pipeline" onClick={() => setMobileMenuOpen(false)} className="hover:text-[#5D3FF3]">
                Readiness Pipeline
              </a>
              <a href="#dna" onClick={() => setMobileMenuOpen(false)} className="hover:text-[#5D3FF3]">
                Career DNA
              </a>
              <a href="#live-discovery" onClick={() => setMobileMenuOpen(false)} className="hover:text-[#5D3FF3]">
                Live Opportunities
              </a>
              <a href="#demo-video" onClick={() => setMobileMenuOpen(false)} className="hover:text-[#5D3FF3]">
                Product Demo
              </a>
              <a href="#architecture" onClick={() => setMobileMenuOpen(false)} className="hover:text-[#5D3FF3]">
                Architecture
              </a>
            </div>
            <div className="pt-4 border-t border-slate-100 flex flex-col gap-2.5">
              <a
                href="https://github.com/Kushh-Santhosh/InternSync"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 py-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl"
              >
                <GithubIcon className="w-4 h-4" />
                <span>View GitHub Repository</span>
              </a>
              <Link
                to="/login"
                className="w-full text-center py-2.5 text-xs font-semibold text-slate-700 border border-slate-200 rounded-xl"
              >
                Sign in
              </Link>
              <Button
                onClick={() => navigate('/signup')}
                className="w-full py-2.5 bg-[#010827] text-white text-xs font-semibold rounded-xl"
              >
                Get started
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* 2. Hero Section: Slide 1 Product Reveal */}
      <section className="relative pt-16 pb-20 px-6 sm:px-10 max-w-7xl mx-auto text-center">
        {/* Ambient brand gradients */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[720px] h-[360px] bg-gradient-to-tr from-purple-100/60 via-blue-100/50 to-cyan-100/30 rounded-full blur-3xl -z-10 pointer-events-none" />

        {/* Hackathon Trust Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200/90 shadow-2xs text-slate-700 text-xs font-semibold mb-6">
          <span className="w-2 h-2 rounded-full bg-[#5D3FF3] animate-pulse" />
          <span>SaaarthiX Hackathon • Team Fensta • Level 2 MVP</span>
        </div>

        {/* Slide 1 Core Message */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-[#010827] max-w-5xl mx-auto leading-[1.12]">
          From Apply Everywhere to <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-[#4220FC] via-[#5D3FF3] to-[#772AFB] bg-clip-text text-transparent">
            Know Where You Fit.
          </span>
        </h1>

        {/* Supporting Value Proposition */}
        <p className="text-base sm:text-lg md:text-xl text-slate-600 max-w-3xl mx-auto mt-6 leading-relaxed font-normal">
          InternSync is an AI-powered opportunity-readiness engine. It extracts your true engineering evidence,
          computes deterministic fit scores across live verified ATS feeds, and guides your preparation.
        </p>

        {/* Primary Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mt-8 mb-12">
          <a
            href="#resume-upload"
            className="w-full sm:w-auto px-7 py-3.5 bg-[#5D3FF3] hover:bg-[#4E32D8] text-white font-semibold text-sm rounded-2xl shadow-lg shadow-purple-600/25 transition-all hover:scale-[1.02] flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Upload Resume PDF</span>
            <ArrowRight className="w-4 h-4" />
          </a>
          <Button
            variant="outline"
            onClick={() => navigate('/opportunities')}
            className="w-full sm:w-auto px-7 py-3.5 text-sm font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl shadow-2xs cursor-pointer"
          >
            Explore 34+ Live Opportunities
          </Button>
          <a
            href="https://github.com/Kushh-Santhosh/InternSync"
            target="_blank"
            rel="noreferrer"
            className="w-full sm:w-auto px-5 py-3.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl transition-all flex items-center justify-center gap-2"
          >
            <GithubIcon className="w-3.5 h-3.5" />
            <span>GitHub Repository</span>
          </a>
        </div>

        {/* Live Functional Resume Upload Card */}
        <div id="resume-upload" className="max-w-3xl mx-auto scroll-mt-28 mb-16 text-left">
          <ResumeUploadCard />
        </div>
      </section>

      {/* 3. Slide 2: The Student Problem */}
      <section id="problem" className="py-20 bg-white border-y border-slate-200/80 px-6 sm:px-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
              The Real Student Struggle
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-[#010827] tracking-tight">
              The broken reality of the internship journey
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
              Students face 4 structural obstacles that turn internship hunting into an exhausting black box.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                num: '01',
                title: 'Discovery Overload',
                desc: 'Scrolling through hundreds of stale, duplicate, or expired job postings across disconnected portals without knowing what is active.',
              },
              {
                num: '02',
                title: 'Eligibility Uncertainty',
                desc: 'Hidden requirements, graduation year restrictions, and degree prerequisites buried deep in text descriptions.',
              },
              {
                num: '03',
                title: 'Unspoken Skill Gaps',
                desc: 'Applying with a keyword resume without knowing which critical tools or project evidence are actually missing.',
              },
              {
                num: '04',
                title: 'Decision Paralysis',
                desc: 'No clear signal whether to apply immediately, spend 14 days preparing, or skip completely to save energy.',
              },
            ].map((prob) => (
              <div
                key={prob.num}
                className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80 hover:border-slate-300 transition-all space-y-3"
              >
                <span className="text-xs font-black text-rose-500 font-mono tracking-wider">{prob.num}</span>
                <h3 className="text-sm font-bold text-slate-900">{prob.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{prob.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Slide 3: The Four Core Gaps */}
      <section id="gaps" className="py-20 px-6 sm:px-10 max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-bold uppercase tracking-wider text-[#5D3FF3] bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
            Systemic Solution
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-[#010827] tracking-tight">
            The four structural gaps InternSync eliminates
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600">
            InternSync replaces guesswork with evidence-based opportunity intelligence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            {
              title: '1. The Discovery Gap',
              problem: 'Scattered listings, fake jobs, and outdated aggregators.',
              solution: 'Live traceable ATS feeds from Greenhouse, Lever, Ashby, and verified employer career portals.',
              badge: 'Verified Feeds',
            },
            {
              title: '2. The Understanding Gap',
              problem: 'Vague buzzword job descriptions that conceal real expectations.',
              solution: 'Transparent extraction of required skills, eligible years, degree criteria, and work modes.',
              badge: 'Explainable JDs',
            },
            {
              title: '3. The Readiness Gap',
              problem: 'Keyword-stuffed resumes that recruiters reject within 6 seconds.',
              solution: 'Dynamic Career DNA synthesizing verified code, project evidence, and degree credentials.',
              badge: 'Substantiated Proof',
            },
            {
              title: '4. The Decision Gap',
              problem: 'Blindly applying to 100+ jobs and facing silent ghosting.',
              solution: 'Deterministic 8-factor rubric classifying every role into APPLY NOW, PREPARE FIRST, or SKIP.',
              badge: 'Actionable Verdicts',
            },
          ].map((gap, idx) => (
            <div
              key={idx}
              className="p-7 rounded-3xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-md transition-all space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900">{gap.title}</h3>
                <span className="text-[11px] font-semibold text-[#5D3FF3] bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded-full">
                  {gap.badge}
                </span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex items-start gap-2 text-slate-500">
                  <span className="text-rose-500 font-bold shrink-0">Gap:</span>
                  <span>{gap.problem}</span>
                </div>
                <div className="flex items-start gap-2 text-slate-800 font-medium">
                  <span className="text-emerald-600 font-bold shrink-0">Fix:</span>
                  <span>{gap.solution}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Slide 4: Introducing InternSync & Core 5-Stage Workflow */}
      <section id="pipeline" className="py-20 bg-slate-900 text-white px-6 sm:px-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-400 bg-purple-950 px-3 py-1 rounded-full border border-purple-800">
              The Engine
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold tracking-tight">
              The 5-Stage Opportunity Readiness Pipeline
            </h2>
            <p className="mt-3 text-sm text-slate-400">
              A continuous, explainable feedback loop from student evidence to verified employer application.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5">
            {[
              {
                step: '01',
                title: 'Evidence Ingestion',
                sub: 'Upload resume PDF, PPT project slides, and technical credentials.',
                icon: FileText,
              },
              {
                step: '02',
                title: 'Career DNA',
                sub: '8-factor extraction across skills, projects, education, and intent.',
                icon: Brain,
              },
              {
                step: '03',
                title: 'Opportunity Research',
                sub: 'Live query across verified Greenhouse, Lever, Ashby, and job boards.',
                icon: Search,
              },
              {
                step: '04',
                title: 'Personalised Match',
                sub: 'Deterministic weighted scoring with explicit fit & gap breakdown.',
                icon: BarChart3,
              },
              {
                step: '05',
                title: 'Preparation & Action',
                sub: 'Direct application link or 14-day sprint roadmap to bridge gaps.',
                icon: Target,
              },
            ].map((st) => (
              <div
                key={st.step}
                className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-3 hover:border-purple-500/50 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-purple-400">{st.step}</span>
                  <st.icon className="w-4 h-4 text-slate-400" />
                </div>
                <h3 className="text-xs font-bold text-white">{st.title}</h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">{st.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Slide 5: Student Profile & Career DNA */}
      <section id="dna" className="py-20 px-6 sm:px-10 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5D3FF3] bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
              Candidate Representation
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#010827] tracking-tight leading-tight">
              Beyond keyword resumes: <br />
              <span className="text-[#5D3FF3]">Dynamic 8-Factor Career DNA</span>
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Traditional recruiters glance at resumes for 6 seconds. InternSync constructs an actionable, structured
              profile across 8 weighted dimensions that persist securely to your account.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="font-bold text-slate-900">Skills (30%)</span>
                <p className="text-slate-500 text-[11px]">Core stack, frameworks & tooling</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="font-bold text-slate-900">Eligibility (20%)</span>
                <p className="text-slate-500 text-[11px]">Year of study & degree criteria</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="font-bold text-slate-900">Project Evidence (15%)</span>
                <p className="text-slate-500 text-[11px]">Substantiated code & demos</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="font-bold text-slate-900">Education (10%)</span>
                <p className="text-slate-500 text-[11px]">University, major & GPA</p>
              </div>
            </div>

            <div className="pt-2">
              <Button
                onClick={() => navigate('/career-dna')}
                className="bg-[#010827] hover:bg-slate-800 text-white text-xs font-semibold px-5 py-3 rounded-xl cursor-pointer"
              >
                <span>View Career DNA Interface</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </div>
          </div>

          {/* Visual Profile Representation */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-[#5D3FF3] flex items-center justify-center font-bold text-base">
                  RS
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Rahul Sharma</h4>
                  <p className="text-xs text-slate-500">B.Tech Computer Science • Year 3</p>
                </div>
              </div>
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Profile Verified
              </span>
            </div>

            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">Extracted Tech Stack</div>
              <div className="flex flex-wrap gap-1.5">
                {['Python', 'React', 'TypeScript', 'Node.js', 'FastAPI', 'PostgreSQL', 'Docker', 'Machine Learning'].map(
                  (sk) => (
                    <span
                      key={sk}
                      className="px-2.5 py-1 text-xs rounded-lg bg-purple-50 text-[#5D3FF3] font-semibold border border-purple-100"
                    >
                      {sk}
                    </span>
                  )
                )}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Extracted from Real PDF Evidence</span>
              </div>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                Extracted cleanly without hallucinations. Fully editable and synchronized with Supabase cloud storage.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Slide 6 & 7: Discover Real Opportunities & Match Fit Analysis */}
      <section id="live-discovery" className="py-20 bg-white border-y border-slate-200/80 px-6 sm:px-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              100% Genuine ATS Listings
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-[#010827] tracking-tight">
              Discover real internship opportunities
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-600">
              Direct application URLs to verified employer career portals. Zero fictional listings. Zero dummy domains.
            </p>
          </div>

          {/* Representative Live Opportunities Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Apply Now */}
            <div className="p-6 rounded-3xl bg-white border-2 border-emerald-500/40 shadow-sm space-y-4 hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  APPLY NOW • 91% Match
                </span>
                <span className="text-[10px] font-mono text-slate-400">Greenhouse ATS</span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Software Development Engineer Intern</h4>
                <p className="text-xs text-slate-500">HackerRank • Bengaluru • Hybrid</p>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-1.5 text-emerald-700">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Matches Python, Machine Learning & FastAPI</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-600">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                  <span>Year 3/4 B.Tech Eligibility Met</span>
                </div>
              </div>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-mono text-[10px]">Stipend: ₹45,000/mo</span>
                <a
                  href="https://job-boards.greenhouse.io/hackerrank/jobs/8229735"
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-[#5D3FF3] hover:underline flex items-center gap-1"
                >
                  Verify ATS <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Card 2: Prepare First */}
            <div className="p-6 rounded-3xl bg-white border-2 border-amber-500/40 shadow-sm space-y-4 hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                  PREPARE FIRST • 74% Match
                </span>
                <span className="text-[10px] font-mono text-slate-400">Jobicy Feed</span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Full Stack Software Engineer</h4>
                <p className="text-xs text-slate-500">Supabase • Remote</p>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-1.5 text-emerald-700">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Matches React, TypeScript & SQL</span>
                </div>
                <div className="flex items-center gap-1.5 text-amber-700">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>Gap: Tailwind CSS & Docker pipelines</span>
                </div>
              </div>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-mono text-[10px]">14-Day Sprint Available</span>
                <a
                  href="https://jobicy.com/jobs/153449-software-engineer-auth"
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-[#5D3FF3] hover:underline flex items-center gap-1"
                >
                  Verify ATS <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Card 3: Skip */}
            <div className="p-6 rounded-3xl bg-white border-2 border-slate-200 shadow-sm space-y-4 hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  SKIP • 46% Match
                </span>
                <span className="text-[10px] font-mono text-slate-400">Greenhouse ATS</span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Senior Infrastructure Intern</h4>
                <p className="text-xs text-slate-500">Rubrik • Bengaluru</p>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-1.5 text-rose-700">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>Requires 4th Year / M.Tech candidate</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 inline-block mr-1" />
                  <span>Requires Kubernetes and C++ kernel depth</span>
                </div>
              </div>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-mono text-[10px]">Protects Your Time</span>
                <span className="text-slate-400 italic">Not a match</span>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <Button
              onClick={() => navigate('/opportunities')}
              className="bg-[#010827] hover:bg-slate-800 text-white text-xs font-semibold px-6 py-3 rounded-xl cursor-pointer"
            >
              <span>Explore All 34+ Live Verified Opportunities</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </div>
        </div>
      </section>

      {/* 8. Slide 8: Resume Intelligence & Preparation */}
      <section className="py-20 px-6 sm:px-10 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <span className="text-xs font-bold uppercase tracking-wider text-[#5D3FF3] bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
              Resume Intelligence
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#010827] tracking-tight leading-tight">
              Targeted Critique & Preparation Roadmaps
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              InternSync doesn't hallucinate fake achievements. It identifies truth-based improvements to your existing
              bullet points, highlights under-demonstrated skills, and creates a focused 14-day sprint.
            </p>

            <div className="space-y-3 text-xs">
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">STAR-Format Bullet Elevation</span>
                  <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md">
                    Verified
                  </span>
                </div>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  Transforms "Built an API with FastAPI" into "Engineered 4 RESTful endpoints using FastAPI and Redis
                  caching, achieving &lt;45ms response latencies for 1,000 concurrent requests."
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">14-Day Preparation Sprint</span>
                  <span className="text-[10px] text-purple-600 font-semibold bg-purple-50 px-2 py-0.5 rounded-md">
                    Skill Lab
                  </span>
                </div>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  Generates daily micro-milestones for roles classified as PREPARE FIRST, so you acquire missing
                  technologies before submitting your application.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <Button
                onClick={() => navigate('/skill-lab')}
                variant="outline"
                className="text-xs font-semibold px-5 py-3 rounded-xl cursor-pointer"
              >
                <span>Explore Skill Lab & Roadmaps</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </div>
          </div>

          {/* Interactive Sprint Visual */}
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 text-white shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-bold text-white">14-Day Readiness Roadmap</span>
              </div>
              <span className="text-[10px] font-mono text-purple-300 bg-purple-950 px-2 py-0.5 rounded">
                Target: Supabase SDE
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-200">Day 1–4: Tailwind CSS & Radix UI</div>
                  <div className="text-[10px] text-slate-400">Design system tokenization & responsive layout</div>
                </div>
                <span className="text-[10px] font-semibold text-emerald-400">Core Gap</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-200">Day 5–9: Docker Containerization</div>
                  <div className="text-[10px] text-slate-400">Multi-stage builds & local dev orchestration</div>
                </div>
                <span className="text-[10px] font-semibold text-purple-400">DevOps Gap</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-200">Day 10–14: Capstone Mini-Project</div>
                  <div className="text-[10px] text-slate-400">Deploy live containerized app to GitHub</div>
                </div>
                <span className="text-[10px] font-semibold text-cyan-400">Evidence</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 italic pt-2">
              "Turn an almost-fit opportunity into a guaranteed high-confidence interview application."
            </p>
          </div>
        </div>
      </section>

      {/* 9. Slide 9: Live Product Demonstration Video Section */}
      <section id="demo-video" className="py-20 bg-slate-50 border-y border-slate-200/80 px-6 sm:px-10">
        <div className="max-w-5xl mx-auto text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-[#5D3FF3] bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
            Live Product Demonstration
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-[#010827] tracking-tight">
            See InternSync in Action
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            From PDF resume upload and deterministic Career DNA extraction to live ATS discovery and verified application
            dispatch.
          </p>

          {/* Video Demonstration Frame */}
          <div className="mt-10 rounded-3xl bg-white border border-slate-200/90 shadow-xl overflow-hidden p-4 sm:p-6 text-left">
            <div className="aspect-video w-full rounded-2xl bg-slate-900 flex flex-col items-center justify-center text-center p-6 relative overflow-hidden group">
              {/* Subtle ambient pulse */}
              <div className="absolute inset-0 bg-gradient-to-tr from-purple-900/30 via-slate-900 to-indigo-900/30" />

              <div className="relative z-10 space-y-4 max-w-md mx-auto">
                <div className="w-16 h-16 rounded-full bg-[#5D3FF3] text-white flex items-center justify-center mx-auto shadow-lg shadow-purple-600/40 group-hover:scale-110 transition-transform">
                  <Play className="w-7 h-7 fill-white ml-1" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white">InternSync Level 2 MVP Walkthrough</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Recorded live end-to-end journey across Chrome with candidate Rahul Sharma.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  <Button
                    size="sm"
                    onClick={() => navigate('/login')}
                    className="bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold px-4 py-2 rounded-xl"
                  >
                    Test Live Demo Account
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate('/opportunities')}
                    className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs font-semibold px-4 py-2 rounded-xl"
                  >
                    Live Opportunity Board
                  </Button>
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
              <span className="flex items-center gap-1.5 font-medium text-slate-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Verified in Chrome: Zero broken routes, deterministic scoring, authenticated Supabase</span>
              </span>
              <a
                href="https://github.com/Kushh-Santhosh/InternSync"
                target="_blank"
                rel="noreferrer"
                className="text-[#5D3FF3] hover:underline flex items-center gap-1 font-semibold"
              >
                Inspect test suites on GitHub <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 10. Slide 10: Architecture, Implementation, and Impact */}
      <section id="architecture" className="py-20 px-6 sm:px-10 max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
            Technical Rigor
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-[#010827] tracking-tight">
            Verified Architecture & Technical Stack
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600">
            Engineering designed for privacy, deterministic truth, and cloud resilience.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Cpu className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Modern Frontend</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Vite, React 19, Strict TypeScript, Tailwind CSS with customized design tokens. Sub-second compilation and
              zero runtime layout shifts.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Supabase Cloud</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              PostgreSQL with Row Level Security (RLS), Supabase Auth (Email + Username support), and private cloud
              storage for resume PDFs.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-3">
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Deterministic Engine</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Weighted mathematical scoring (Skills 30%, Eligibility 20%, Projects 15%, etc.). Never outputs randomized
              probabilities. Explainable by design.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-3">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <GitBranch className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Resilient AI Routing</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Unified router supporting Google Gemini and OpenRouter models with automated fallback to deterministic
              local extraction if offline.
            </p>
          </div>
        </div>

        {/* Production Verification Status Bar */}
        <div className="mt-8 p-5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600 gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="font-semibold text-slate-900">Production Deployed on Vercel:</span>
            <span className="font-mono text-slate-500">https://intern-sync-one.vercel.app</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-semibold text-slate-500">
            <span>86 Unit Tests Passing</span>
            <span>•</span>
            <span>34 Verified ATS Opportunities</span>
            <span>•</span>
            <span>Zero Dead Links</span>
          </div>
        </div>
      </section>

      {/* 11. Slide 11: Vision, Final CTA & Links */}
      <section className="py-20 px-6 sm:px-10 max-w-5xl mx-auto text-center">
        <div className="p-10 sm:p-14 rounded-3xl bg-gradient-to-b from-[#010827] to-slate-950 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#5D3FF3]/15 rounded-full blur-3xl pointer-events-none" />
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight max-w-2xl mx-auto leading-tight">
            Stop applying everywhere. <br />
            <span className="text-[#5D3FF3]">Know where you fit.</span>
          </h2>
          <p className="mt-4 text-slate-400 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Understand your fit. Improve your profile. Find the right opportunity.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              size="lg"
              onClick={() => navigate('/signup')}
              className="w-full sm:w-auto px-8 py-3.5 bg-[#5D3FF3] hover:bg-[#4E32D8] text-white font-semibold text-sm rounded-xl shadow-lg shadow-purple-600/25 cursor-pointer"
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
            <a
              href="https://github.com/Kushh-Santhosh/InternSync"
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto px-5 py-3.5 text-xs font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl flex items-center justify-center gap-2"
            >
              <GithubIcon className="w-3.5 h-3.5" />
              <span>GitHub</span>
            </a>
          </div>
        </div>
      </section>

      {/* 12. Minimal Clean Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-12 px-6 sm:px-10 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-2 space-y-3">
            <InternSyncLogo variant="full" size="sm" to="/" />
            <p className="text-slate-500 text-[11px] max-w-xs leading-relaxed">
              AI-powered internship opportunity-readiness platform. Built for students and academic ecosystems by Team
              Fensta for SaaarthiX.
            </p>
            <div className="pt-1 flex items-center gap-3">
              <a
                href="https://github.com/Kushh-Santhosh/InternSync"
                target="_blank"
                rel="noreferrer"
                className="text-slate-600 hover:text-slate-900 flex items-center gap-1.5 font-semibold"
              >
                <GithubIcon className="w-3.5 h-3.5" />
                <span>GitHub Repository</span>
              </a>
            </div>
            <p className="text-slate-400 text-[10px]">© 2026 InternSync. All rights reserved.</p>
          </div>

          <div>
            <h5 className="font-bold text-slate-900 mb-3">Product</h5>
            <ul className="space-y-2">
              <li>
                <a href="#pipeline" className="hover:text-slate-900">
                  Readiness Pipeline
                </a>
              </li>
              <li>
                <Link to="/opportunities" className="hover:text-slate-900">
                  Live Opportunities
                </Link>
              </li>
              <li>
                <Link to="/career-dna" className="hover:text-slate-900">
                  Career DNA
                </Link>
              </li>
              <li>
                <Link to="/skill-lab" className="hover:text-slate-900">
                  Skill Lab
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="font-bold text-slate-900 mb-3">Hackathon MVP</h5>
            <ul className="space-y-2">
              <li>
                <a href="#demo-video" className="hover:text-slate-900">
                  Demo Walkthrough
                </a>
              </li>
              <li>
                <a href="#architecture" className="hover:text-slate-900">
                  System Architecture
                </a>
              </li>
              <li>
                <Link to="/dream-internship" className="hover:text-slate-900">
                  Dream Role Engine
                </Link>
              </li>
              <li>
                <Link to="/assistant" className="hover:text-slate-900">
                  Career Assistant
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="font-bold text-slate-900 mb-3">Account & Access</h5>
            <ul className="space-y-2">
              <li>
                <Link to="/login" className="hover:text-slate-900">
                  Sign In (Email / Username)
                </Link>
              </li>
              <li>
                <Link to="/signup" className="hover:text-slate-900">
                  Register Candidate
                </Link>
              </li>
              <li>
                <Link to="/settings" className="hover:text-slate-900">
                  API & Cloud Settings
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/Kushh-Santhosh/InternSync"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-slate-900"
                >
                  Source Code
                </a>
              </li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  )
}
