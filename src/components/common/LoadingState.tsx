import React from 'react'
import { cn } from '@/lib/utils/cn'

interface LoadingStateProps {
  label?: string
  sublabel?: string
  className?: string
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  label = 'Loading insights...',
  sublabel = 'Analyzing Career DNA and live requirements',
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-12 text-center rounded-xl border border-slate-200 bg-white/70 backdrop-blur-xs my-6',
        className
      )}
    >
      <div className="relative w-10 h-10 mb-3">
        <div className="absolute inset-0 rounded-full border-2 border-indigo-200 animate-ping opacity-25" />
        <div className="w-10 h-10 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
      </div>
      <h4 className="text-sm font-semibold text-slate-800">{label}</h4>
      {sublabel && <p className="text-xs text-slate-500 mt-1 max-w-xs">{sublabel}</p>}
    </div>
  )
}
