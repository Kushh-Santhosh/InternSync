import React, { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  CheckCircle2,
  FileCheck2,
  HelpCircle,
  Info,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  XCircle,
} from 'lucide-react'
import { useApp } from '@/app/context'
import { ASSESSMENT_QUESTIONS } from '@/data/assessment-questions'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils/cn'

export const SkillLabPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const { recordAssessmentResult, skills } = useApp()

  const initialSkill = searchParams.get('skill') || 'Python'
  const [selectedSkill, setSelectedSkill] = useState<string>(initialSkill)
  const [isQuizActive, setIsQuizActive] = useState(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [hasSubmittedAnswer, setHasSubmittedAnswer] = useState(false)
  const [scoreCount, setScoreCount] = useState(0)
  const [isQuizCompleted, setIsQuizCompleted] = useState(false)

  // Current verified skill signals from profile
  const skillSignalSummary = [
    { name: 'Python', score: skills.find((s) => s.skillName === 'Python')?.assessmentScore || 86, color: 'text-indigo-600', status: 'Strong' },
    { name: 'React', score: skills.find((s) => s.skillName === 'React')?.assessmentScore || 74, color: 'text-emerald-600', status: 'Developing' },
    { name: 'SQL', score: skills.find((s) => s.skillName === 'SQL')?.assessmentScore || 43, color: 'text-amber-600', status: 'Needs preparation' },
    { name: 'Machine Learning', score: skills.find((s) => s.skillName === 'Machine Learning')?.assessmentScore || 58, color: 'text-blue-600', status: 'Developing' },
  ]

  // Filter questions for the active skill
  const skillQuestions = ASSESSMENT_QUESTIONS.filter(
    (q) => q.skillName.toLowerCase() === selectedSkill.toLowerCase()
  )

  const activeQuestion = skillQuestions[currentQuestionIndex]

  const handleStartQuiz = (skill: string) => {
    setSelectedSkill(skill)
    setIsQuizActive(true)
    setCurrentQuestionIndex(0)
    setSelectedAnswer(null)
    setHasSubmittedAnswer(false)
    setScoreCount(0)
    setIsQuizCompleted(false)
  }

  const handleSelectAnswer = (index: number) => {
    if (hasSubmittedAnswer) return
    setSelectedAnswer(index)
  }

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null || !activeQuestion) return
    setHasSubmittedAnswer(true)
    if (selectedAnswer === activeQuestion.correctIndex) {
      setScoreCount((prev) => prev + 1)
    }
  }

  const handleNextQuestion = () => {
    if (currentQuestionIndex + 1 < skillQuestions.length) {
      setCurrentQuestionIndex((prev) => prev + 1)
      setSelectedAnswer(null)
      setHasSubmittedAnswer(false)
    } else {
      const normalizedScore = Math.round(
        ((scoreCount + (selectedAnswer === activeQuestion?.correctIndex ? 1 : 0)) /
          skillQuestions.length) *
          100
      )
      recordAssessmentResult(selectedSkill, normalizedScore)
      setIsQuizCompleted(true)
    }
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      {/* Header Section (Priority 8 Copy) */}
      <div className="pb-6 border-b border-slate-200">
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 mb-1.5">
          <FileCheck2 className="w-3.5 h-3.5" />
          <span>Skill Lab & Validation</span>
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          VALIDATE YOUR SKILLS
        </h1>
        <p className="text-sm text-slate-600 mt-2 max-w-2xl leading-relaxed">
          You don't need to prove everything. We'll validate the skills most relevant to the
          internships you're targeting.
        </p>

        {/* Disclaimer Callout */}
        <div className="mt-4 p-3.5 rounded-xl bg-slate-100/80 border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <span>
            These assessments produce <strong>InternSync Skill Signals</strong> — evidence-backed indicators of applied technical reasoning designed for internship matching, not commercial certifications.
          </span>
        </div>
      </div>

      {/* Verified Skill Signals Overview Cards (Priority 8) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Your Target Skill Signals
          </h2>
          <span className="text-xs text-slate-500">Updated from live quiz attempts</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {skillSignalSummary.map((sig) => (
            <div
              key={sig.name}
              onClick={() => handleStartQuiz(sig.name)}
              className={cn(
                'p-4 rounded-2xl border bg-white shadow-2xs hover:border-indigo-300 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between group',
                selectedSkill.toLowerCase() === sig.name.toLowerCase() && isQuizActive
                  ? 'border-indigo-500 ring-2 ring-indigo-50'
                  : 'border-slate-200'
              )}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">{sig.name}</span>
                  <span className="text-[10px] font-semibold text-slate-400">Signal</span>
                </div>
                <div className="text-3xl font-black text-slate-900 mt-2">{sig.score}%</div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="font-semibold text-slate-500">{sig.status}</span>
                <span className="text-indigo-600 font-bold group-hover:underline">Test →</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quiz Area */}
      {isQuizActive && !isQuizCompleted && activeQuestion && (
        <div className="p-6 sm:p-8 rounded-3xl border border-slate-200 bg-white shadow-xs space-y-6 animate-in fade-in">
          {/* Top Indicator */}
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 pb-3 border-b border-slate-100">
            <span className="flex items-center gap-1.5 text-indigo-700">
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {selectedSkill} Signal Test: Question {currentQuestionIndex + 1} of {skillQuestions.length}
              </span>
            </span>
            <span className="capitalize px-2 py-0.5 rounded bg-slate-100 text-slate-700">
              {activeQuestion.difficulty}
            </span>
          </div>

          {/* Question Text */}
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
              {activeQuestion.question}
            </h3>

            {activeQuestion.codeSnippet && (
              <div className="mt-3 p-4 rounded-xl bg-slate-900 text-emerald-300 font-mono text-xs overflow-x-auto">
                <pre>{activeQuestion.codeSnippet}</pre>
              </div>
            )}
          </div>

          {/* Options */}
          <div className="space-y-2.5 pt-2">
            {activeQuestion.options.map((option, idx) => {
              const isSelected = selectedAnswer === idx
              const isCorrect = idx === activeQuestion.correctIndex

              let style = 'border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50'
              if (hasSubmittedAnswer) {
                if (isCorrect) {
                  style = 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold'
                } else if (isSelected) {
                  style = 'border-rose-400 bg-rose-50 text-rose-950 font-bold'
                } else {
                  style = 'opacity-40 border-slate-200'
                }
              } else if (isSelected) {
                style = 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-semibold ring-1 ring-indigo-500'
              }

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectAnswer(idx)}
                  className={cn(
                    'w-full text-left p-3.5 rounded-xl border text-xs transition-all flex items-center justify-between cursor-pointer',
                    style
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-bold flex items-center justify-center shrink-0">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span>{option}</span>
                  </div>

                  {hasSubmittedAnswer && isCorrect && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  )}
                  {hasSubmittedAnswer && isSelected && !isCorrect && (
                    <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                </button>
              )
            })}
          </div>

          {/* Explanation box after submission */}
          {hasSubmittedAnswer && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1 animate-in fade-in">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
                <span>Explanation & Context</span>
              </div>
              <p className="leading-relaxed">{activeQuestion.explanation}</p>
            </div>
          )}

          {/* Bottom Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Score: {scoreCount} / {currentQuestionIndex + (hasSubmittedAnswer ? 1 : 0)}
            </span>

            {!hasSubmittedAnswer ? (
              <Button
                size="md"
                onClick={handleSubmitAnswer}
                disabled={selectedAnswer === null}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs"
              >
                Submit Answer
              </Button>
            ) : (
              <Button
                size="md"
                onClick={handleNextQuestion}
                className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs"
              >
                {currentQuestionIndex + 1 < skillQuestions.length ? 'Next Question →' : 'Complete Signal Test'}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Quiz Complete Summary Card */}
      {isQuizCompleted && (
        <div className="p-8 rounded-3xl border border-emerald-200 bg-white shadow-lg text-center space-y-4 animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
            <ShieldCheck className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-extrabold text-slate-900">
            Skill Signal Recorded!
          </h2>

          <p className="text-xs text-slate-600 max-w-md mx-auto">
            Your signal score for <strong>{selectedSkill}</strong> has been updated. This verification
            immediately strengthens your profile evidence and boosts match scores for relevant roles.
          </p>

          <div className="inline-flex items-center gap-6 p-4 rounded-2xl bg-slate-50 border border-slate-200 my-2">
            <div>
              <div className="text-xs text-slate-500 font-medium">Questions Correct</div>
              <div className="text-2xl font-extrabold text-slate-900">
                {scoreCount} / {skillQuestions.length}
              </div>
            </div>
            <div className="w-px h-8 bg-slate-200" />
            <div>
              <div className="text-xs text-slate-500 font-medium">New Signal Level</div>
              <div className="text-2xl font-extrabold text-emerald-600">
                {Math.round((scoreCount / skillQuestions.length) * 100)}%
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 pt-4">
            <Button
              variant="outline"
              size="md"
              onClick={() => handleStartQuiz(selectedSkill)}
              className="text-xs"
            >
              <RotateCcw className="w-4 h-4 mr-1.5" />
              <span>Retake Test</span>
            </Button>
            <Button
              size="md"
              onClick={() => (window.location.href = '/career-dna')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs"
            >
              <span>View Updated Career DNA →</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
