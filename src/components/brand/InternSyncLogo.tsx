import React from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils/cn'

export interface InternSyncLogoProps {
  variant?: 'full' | 'mark' | 'dark'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  to?: string
}

export const InternSyncLogo: React.FC<InternSyncLogoProps> = ({
  variant = 'full',
  size = 'md',
  className,
  to,
}) => {
  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-7 h-7',
    lg: 'w-9 h-9',
  }

  const titleSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-2xl',
  }

  const subSizes = {
    sm: 'text-[9px]',
    md: 'text-[10px]',
    lg: 'text-xs',
  }

  const isDark = variant === 'dark'

  const content = (
    <div className={cn('inline-flex items-center gap-2.5 select-none group', className)}>
      {/* Brand Mark: Geometric Convergence Vector */}
      <svg
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn('shrink-0 group-hover:scale-105 transition-transform duration-200', iconSizes[size])}
        aria-label="InternSync Logo"
      >
        {/* Top trajectory: Student Profile & Skills */}
        <path
          d="M4 7H11L18 14H12.5L4 7Z"
          fill={isDark ? '#F8FAFC' : '#0F172A'}
        />
        {/* Bottom trajectory: Industry Opportunities */}
        <path
          d="M4 25H11L18 18H12.5L4 25Z"
          fill={isDark ? '#F8FAFC' : '#0F172A'}
        />
        {/* Convergent Forward Vector: Opportunity Readiness */}
        <path
          d="M17 11.5L28 16L17 20.5L20 16L17 11.5Z"
          fill={isDark ? '#818CF8' : '#4F46E5'}
        />
      </svg>

      {/* Typography for "full" and "dark" variants */}
      {variant !== 'mark' && (
        <div className="flex flex-col text-left">
          <span
            className={cn(
              'font-extrabold tracking-tight leading-none',
              isDark ? 'text-white' : 'text-slate-900',
              titleSizes[size]
            )}
          >
            Intern<span className={isDark ? 'text-indigo-400' : 'text-indigo-600'}>Sync</span>
          </span>
          <span
            className={cn(
              'font-semibold uppercase tracking-wider mt-0.5',
              isDark ? 'text-slate-400' : 'text-slate-500',
              subSizes[size]
            )}
          >
            Opportunity Readiness
          </span>
        </div>
      )}
    </div>
  )

  if (to) {
    return (
      <Link to={to} className="inline-block hover:opacity-95 transition-opacity">
        {content}
      </Link>
    )
  }

  return content
}
