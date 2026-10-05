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
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
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

  const content = (
    <div className={cn('inline-flex items-center gap-2.5 select-none group', className)}>
      {/* Brand Mark SVG Symbol */}
      <div
        className={cn(
          'relative rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-indigo-700 flex items-center justify-center shrink-0 shadow-xs shadow-indigo-600/20 group-hover:scale-105 transition-transform duration-200',
          iconSizes[size]
        )}
      >
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-3/5 h-3/5"
        >
          {/* Synchronized nodes */}
          <circle cx="10" cy="16" r="3.2" fill="#FFFFFF" fillOpacity="0.95" />
          <circle cx="22" cy="16" r="3.2" fill="#FFFFFF" fillOpacity="0.95" />
          {/* Readiness bridge */}
          <path
            d="M10 16C10 11.5 22 11.5 22 16C22 20.5 10 20.5 10 16Z"
            stroke="#FFFFFF"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Spark of fit */}
          <circle cx="16" cy="16" r="1.6" fill="#38BDF8" />
        </svg>
      </div>

      {/* Typography for "full" and "dark" variants */}
      {variant !== 'mark' && (
        <div className="flex flex-col text-left">
          <span
            className={cn(
              'font-extrabold tracking-tight leading-none',
              variant === 'dark' ? 'text-white' : 'text-slate-900',
              titleSizes[size]
            )}
          >
            Intern<span className={variant === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}>Sync</span>
          </span>
          <span
            className={cn(
              'font-semibold uppercase tracking-wider mt-0.5',
              variant === 'dark' ? 'text-slate-400' : 'text-slate-400',
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
