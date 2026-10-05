import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  UploadCloud,
  CheckCircle2,
  ArrowRight,
  BrainCircuit,
  Check,
} from 'lucide-react'
import { useApp } from '@/app/context'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils/cn'

interface ResumeUploadCardProps {
  className?: string
  compact?: boolean
  onSuccess?: () => void
}

const STEPS = [
  { step: 1, label: 'Reading your resume', desc: 'Parsing text and document structure' },
  { step: 2, label: 'Understanding your experience', desc: 'Validating projects and academic history' },
  { step: 3, label: 'Building your Career DNA', desc: 'Synthesizing skills, evidence & target roles' },
  { step: 4, label: 'Finding matching internships', desc: 'Searching current listings across employers' },
  { step: 5, label: 'Checking requirements', desc: 'Analyzing prerequisites, degree & work arrangement' },
  { step: 6, label: 'Calculating your fit', desc: 'Evaluating deterministic fit score & next steps' },
]

export const ResumeUploadCard: React.FC<ResumeUploadCardProps> = ({
  className,
  compact = false,
  onSuccess,
}) => {
  const navigate = useNavigate()
  const { uploadDocument, searchLiveOpportunities } = useApp()

  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null)
  const [uploadFinished, setUploadFinished] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFile(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processFile(e.target.files[0])
    }
  }

  const processFile = async (file: File) => {
    setIsProcessing(true)
    setUploadedFileName(file.name)
    setCurrentStep(1)

    try {
      // Step 1: Read profile
      await new Promise((r) => setTimeout(r, 500))
      setCurrentStep(2)

      // Step 2 & 3: Process document, extract skills, validate project proof
      const analysisPromise = uploadDocument(file, 'resume')
      await new Promise((r) => setTimeout(r, 500))
      setCurrentStep(3)

      await new Promise((r) => setTimeout(r, 500))
      setCurrentStep(4)

      // Await actual extraction completion
      await analysisPromise

      await new Promise((r) => setTimeout(r, 500))
      setCurrentStep(5)

      // Step 5: Search live opportunities
      try {
        await searchLiveOpportunities(true)
      } catch {
        // Continue even if search fallback occurs
      }

      setCurrentStep(6)
      // Step 6: Opportunity fit complete
      await new Promise((r) => setTimeout(r, 500))

      setUploadFinished(true)
      if (onSuccess) {
        onSuccess()
      } else {
        setTimeout(() => {
          navigate('/opportunities')
        }, 1200)
      }
    } catch (err) {
      console.error('Resume processing error:', err)
      setIsProcessing(false)
    }
  }

  return (
    <div
      className={cn(
        'relative rounded-3xl bg-white border border-slate-200/90 shadow-xl shadow-indigo-900/5 overflow-hidden transition-all',
        isDragging && 'border-indigo-500 bg-indigo-50/20 ring-4 ring-indigo-500/10',
        compact ? 'p-6' : 'p-8 sm:p-10',
        className
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {!isProcessing && !uploadFinished && (
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs mb-1">
            <UploadCloud className="w-8 h-8" />
          </div>

          <div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Upload your resume
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md">
              Drag & drop your document here, or choose a file from your device.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-1.5 py-1 text-[11px] font-semibold text-slate-400">
            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">PDF</span>
            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">DOC</span>
            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">DOCX</span>
            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">PPT</span>
            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">PPTX</span>
            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">TXT</span>
          </div>

          <Button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm px-7 py-3 rounded-xl shadow-md shadow-indigo-600/20 cursor-pointer"
          >
            <span>Choose file</span>
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>

          <p className="text-[11px] text-slate-400 font-medium">
            We'll build your Career DNA automatically & find your best matching live internships
          </p>
        </div>
      )}

      {/* In-Flight Multi-Step Processing View */}
      {isProcessing && !uploadFinished && (
        <div className="space-y-6 py-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
                <BrainCircuit className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  Building your Opportunity Readiness
                </h4>
                <p className="text-xs text-slate-500 font-mono truncate max-w-xs sm:max-w-md">
                  {uploadedFileName}
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
              Step {currentStep} of 6
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-indigo-600 transition-all duration-500 ease-out"
              style={{ width: `${(currentStep / 6) * 100}%` }}
            />
          </div>

          {/* Step By Step List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {STEPS.map((s) => {
              const isPast = currentStep > s.step
              const isCurrent = currentStep === s.step
              return (
                <div
                  key={s.step}
                  className={cn(
                    'p-3 rounded-xl border transition-all text-xs flex items-start gap-2.5',
                    isPast
                      ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                      : isCurrent
                      ? 'bg-indigo-50/80 border-indigo-300 text-indigo-950 ring-2 ring-indigo-500/10'
                      : 'bg-slate-50/60 border-slate-100 text-slate-400'
                  )}
                >
                  <div className="mt-0.5 shrink-0">
                    {isPast ? (
                      <div className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    ) : isCurrent ? (
                      <div className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold animate-spin">
                        ●
                      </div>
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-300 flex items-center justify-center text-[10px]">
                        {s.step}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="font-semibold">{s.label}</div>
                    <div className={cn('text-[11px]', isCurrent ? 'text-indigo-700' : 'text-slate-500')}>
                      {s.desc}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Done View */}
      {uploadFinished && (
        <div className="flex flex-col items-center text-center space-y-4 py-4 animate-fadeIn">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900">Career DNA Initialized!</h3>
            <p className="text-xs text-slate-600 mt-1 max-w-md">
              We identified your skills, calculated your fit scores, and discovered live opportunities matched to your profile.
            </p>
          </div>
          <Button
            onClick={() => navigate('/opportunities')}
            className="bg-slate-900 hover:bg-slate-800 text-white text-xs px-6 py-2.5 rounded-xl cursor-pointer"
          >
            <span>View Your Best Internships</span>
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </div>
      )}
    </div>
  )
}
