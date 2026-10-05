import React from 'react'
import { cn } from '@/lib/utils/cn'

interface ScoreRingProps {
  score: number
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showLabel?: boolean
  className?: string
}

export const ScoreRing: React.FC<ScoreRingProps> = ({
  score,
  size = 'md',
  showLabel = true,
  className,
}) => {
  const normalized = Math.min(100, Math.max(0, score))

  const sizeConfig = {
    sm: { diameter: 44, strokeWidth: 3.5, fontSize: 'text-xs font-semibold' },
    md: { diameter: 64, strokeWidth: 5, fontSize: 'text-base font-bold' },
    lg: { diameter: 88, strokeWidth: 6, fontSize: 'text-xl font-bold' },
    xl: { diameter: 120, strokeWidth: 8, fontSize: 'text-3xl font-extrabold' },
  }

  const { diameter, strokeWidth, fontSize } = sizeConfig[size]
  const radius = (diameter - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (normalized / 100) * circumference

  // Color by threshold
  const getColor = (s: number) => {
    if (s >= 80) return { stroke: '#10b981', text: 'text-emerald-700', bg: 'text-emerald-50' }
    if (s >= 60) return { stroke: '#f59e0b', text: 'text-amber-700', bg: 'text-amber-50' }
    return { stroke: '#f43f5e', text: 'text-rose-700', bg: 'text-rose-50' }
  }

  const colors = getColor(normalized)

  return (
    <div className={cn('inline-flex flex-col items-center justify-center', className)}>
      <div className="relative inline-flex items-center justify-center">
        <svg width={diameter} height={diameter} className="rotate-[-90deg]">
          {/* Background Track */}
          <circle
            cx={diameter / 2}
            cy={diameter / 2}
            r={radius}
            stroke="#e2e8f0"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Active Value Progress */}
          <circle
            cx={diameter / 2}
            cy={diameter / 2}
            r={radius}
            stroke={colors.stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn('tracking-tight font-sans', fontSize, colors.text)}>
            {normalized}%
          </span>
        </div>
      </div>
      {showLabel && (
        <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mt-1">
          Match
        </span>
      )}
    </div>
  )
}
