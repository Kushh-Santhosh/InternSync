import React, { useEffect, useRef, useState } from 'react'
import {
  ArrowUp,
  BrainCircuit,
  Plus,
  Sparkles,
  Zap,
} from 'lucide-react'
import { useApp } from '@/app/context'
import { Button } from '@/components/ui/Button'
import type { AssistantMessage } from '@/types'
import { cn } from '@/lib/utils/cn'

import { AssistantToolExecutor } from '@/features/ai/assistant-tools'

export const AssistantPage: React.FC = () => {
  const { profile, skills, projects, opportunities, matches, isDemoMode } = useApp()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [messages, setMessages] = useState<AssistantMessage[]>([])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const suggestionChips = [
    'Find internships for me',
    'What am I missing for AI internships?',
    'Which opportunity should I apply to?',
    'How can I improve my resume?',
    'What should I learn next?',
  ]

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputMessage).trim()
    if (!query || isTyping) return

    const userMsg: AssistantMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMsg])
    setInputMessage('')
    setIsTyping(true)

    try {
      const executor = new AssistantToolExecutor({
        student: profile,
        skills,
        projects,
        opportunities,
        matches,
        isDemoMode,
      })

      const lower = query.toLowerCase()
      let response = ''

      if (
        lower.includes('which internship') ||
        lower.includes('apply to') ||
        lower.includes('find internships') ||
        lower.includes('search again') ||
        lower.includes('recommend')
      ) {
        const searchRes = await executor.searchLiveInternships(lower.includes('search again') ? query : undefined)
        response = searchRes.summary
      } else if (lower.includes('why is my match score low') || lower.includes('low score') || lower.includes('scoring')) {
        response = `Match scores on InternSync are computed deterministically across 8 distinct vectors:

1. **Skill Compatibility (30% weight):**
   Evaluates overlap between requirements and skills verified in your Career DNA.
2. **Academic Eligibility (20% weight):**
   Verifies degree (${profile.degree}) and graduation year (${profile.graduationYear}, Year ${profile.currentYear}). Hard eligibility mismatches cap the score to prevent wasted applications.
3. **Project Proof (15% weight):**
   Substantiates claims through project repos, PPT slides, and code evidence.
4. **Education (10%), Experience (10%), Location (5%), Availability (5%), Intent (5%).**

*Tip: Open any Opportunity Detail page to view the exact factor-by-factor breakdown.*`
      } else if (lower.includes('why do i match') || lower.includes('why this fit') || lower.includes('why match')) {
        const topOpp = opportunities[0]
        if (topOpp) {
          const m = matches.get(topOpp.id)
          response = `### Why You Match **${topOpp.roleTitle} @ ${topOpp.companyName}** (${m?.overallMatchScore || 80}% Fit):
- **Eligibility:** Verified for ${profile.degree} (Year ${profile.currentYear})
- **Direct Skill Matches:**
${m?.whyMatched.map((w) => `  ✓ ${w}`).join('\n') || '  ✓ Core stack alignment'}
- **Identified Gaps to Prepare:**
${m?.missingSkills.map((g) => `  ⚠ ${g}`).join('\n') || '  None - Ready to submit'}
- **Recommendation:** **${m?.recommendation || 'APPLY NOW'}**`
        } else {
          response = 'Please discover live opportunities first to evaluate role fit.'
        }
      } else if (lower.includes('improve my resume') || lower.includes('resume')) {
        response = `### Targeted Resume Recommendations for ${profile.fullName}:
1. **Quantify System Evidence:**
   Highlight specific metrics in your project highlights (e.g. latency, concurrency, user scale) to substantiate your top skills.
2. **Address Highest-Leverage Gaps:**
   ${executor.getSkillGaps()}
3. **ATS Alignment:**
   Keep headings standard (Education, Technical Skills, Projects, Experience) for flawless machine-readability.`
      } else if (lower.includes('what skill should i learn') || lower.includes('learn next') || lower.includes('gap') || lower.includes('missing')) {
        response = executor.getSkillGaps()
      } else if (lower.includes('compare my top 3') || lower.includes('compare')) {
        response = executor.compareOpportunities()
      } else if (lower.includes('14-day') || lower.includes('preparation plan') || lower.includes('roadmap')) {
        response = executor.createPreparationPlan()
      } else if (lower.includes('career dna') || lower.includes('my profile')) {
        response = executor.getCareerDNA()
      } else {
        response = `I analyzed your **Career DNA** (${profile.fullName} · ${profile.degree} Year ${profile.currentYear}).

You have **${skills.length} verified skills** and **${projects.length} project evidence source(s)**.

How can I help you take your next best career step?
- "Which internships should I apply to?"
- "What skill should I learn next?"
- "Compare my top 3 opportunities"
- "Build me a 14-day preparation plan"`
      }

      const assistantMsg: AssistantMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, assistantMsg])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: 'Sorry, I encountered an issue analyzing your request. Please try again.',
          timestamp: new Date().toISOString(),
        },
      ])
    } finally {
      setIsTyping(false)
    }
  }

  const handleResetChat = () => {
    setMessages([])
    setInputMessage('')
  }

  return (
    <div className="flex h-[calc(100vh-7.5rem)] rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-xs">
      {/* Left Context Sidebar */}
      <div className="hidden lg:flex w-72 flex-col justify-between border-r border-slate-100 bg-slate-50/50 p-4">
        <div className="space-y-4">
          <Button
            size="sm"
            onClick={handleResetChat}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs justify-start"
          >
            <Plus className="w-3.5 h-3.5 mr-2" />
            <span>New Conversation</span>
          </Button>

          {/* Student Profile Quick Snapshot */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 text-xs space-y-2.5">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <BrainCircuit className="w-4 h-4 text-indigo-600" />
              <span>Loaded Career DNA</span>
            </div>
            <div className="text-[11px] text-slate-600 space-y-1">
              <div className="font-bold text-slate-800">{profile.fullName}</div>
              <div>{profile.degree} (Year {profile.currentYear})</div>
              <div>{profile.location}</div>
            </div>
            <div className="pt-2 border-t border-slate-100 text-[11px] text-indigo-700 font-semibold flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-500" />
                <span>{opportunities.length} Opportunities Evaluated</span>
              </span>
            </div>
          </div>
        </div>

        <div className="text-[11px] text-slate-400 text-center">
          InternSync Career Assistant
        </div>
      </div>

      {/* Main Conversation Stream */}
      <div className="flex-1 flex flex-col justify-between min-w-0 bg-white">
        {/* Messages or Large Empty State */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6">
          {messages.length === 0 ? (
            /* Large Empty State */
            <div className="h-full flex flex-col items-center justify-center text-center max-w-xl mx-auto py-12">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mb-4 shadow-2xs">
                <Zap className="w-7 h-7 fill-indigo-600" />
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Career Assistant
              </h2>

              <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-md leading-relaxed">
                Ask anything about your readiness, internship matches, missing skills, or how to bridge gaps.
              </p>

              {/* Suggestion Chips Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-8 w-full text-left">
                {suggestionChips.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => handleSendMessage(chip)}
                    className="p-3 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 text-xs font-semibold text-slate-700 hover:text-indigo-900 transition-all cursor-pointer shadow-2xs text-left"
                  >
                    {chip} →
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Active Message Flow */
            messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  'flex gap-3 max-w-2xl',
                  msg.role === 'user' ? 'ml-auto justify-end' : 'mr-auto'
                )}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                    <Zap className="w-4 h-4 fill-white" />
                  </div>
                )}

                <div
                  className={cn(
                    'rounded-2xl p-4 text-xs leading-relaxed space-y-2',
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white font-medium shadow-xs'
                      : 'bg-slate-50 border border-slate-100 text-slate-800 shadow-2xs whitespace-pre-line'
                  )}
                >
                  {msg.content}
                </div>

                {msg.role === 'user' && (
                  <img
                    src={profile.avatarUrl}
                    alt={profile.fullName}
                    className="w-8 h-8 rounded-xl object-cover border border-slate-200 shrink-0 mt-0.5"
                  />
                )}
              </div>
            ))
          )}

          {isTyping && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Zap className="w-4 h-4 fill-white" />
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" />
                <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]" />
                <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion Starter Pills & Composer */}
        <div className="p-4 sm:p-6 border-t border-slate-100 bg-white">
          {messages.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-3">
              {suggestionChips.slice(0, 3).map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleSendMessage(prompt)}
                  className="px-3 py-1 rounded-full text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors whitespace-nowrap cursor-pointer"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Composer Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSendMessage()
            }}
            className="relative flex items-center"
          >
            <input
              type="text"
              placeholder="Ask about your internship fit, skill gaps, or preparation steps..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              className="w-full text-xs pl-4 pr-12 py-3.5 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-indigo-500 shadow-2xs"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isTyping}
              className="absolute right-2.5 p-2 rounded-xl bg-indigo-600 text-white disabled:opacity-30 disabled:pointer-events-none hover:bg-indigo-700 transition-all cursor-pointer"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
