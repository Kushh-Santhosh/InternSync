import React from 'react'
import { ArrowUpRight, Clock, AlertTriangle } from 'lucide-react'
import type { RecommendationType } from '@/types'
import { cn } from '@/lib/utils/cn'

interface RecommendationBadgeProps {
  type: RecommendationType
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export const RecommendationBadge: React.FC<RecommendationBadgeProps> = ({
  type,
  size = 'md',
  className,
}) => {
  const configs = {
    'APPLY NOW': {
      label: 'APPLY NOW',
      icon: ArrowUpRight,
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-300/80',
      dot: 'bg-emerald-500',
    },
    'PREPARE FIRST': {
      label: 'PREPARE FIRST',
      icon: Clock,
      bg: 'bg-amber-50 text-amber-800 border-amber-300/80',
      dot: 'bg-amber-500',
    },
    SKIP: {
      label: 'SKIP',
      icon: AlertTriangle,
      bg: 'bg-slate-100 text-slate-700 border-slate-300/80',
      dot: 'bg-slate-400',
    },
  }

  const { label, icon: Icon, bg, dot } = configs[type] || configs.SKIP

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-semibold tracking-wide',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-bold tracking-wide',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border shadow-2xs uppercase',
        bg,
        sizeClasses[size],
        className
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full', dot)} />
      <span>{label}</span>
      <Icon className="w-3.5 h-3.5 opacity-80" />
    </span>
  )
}
