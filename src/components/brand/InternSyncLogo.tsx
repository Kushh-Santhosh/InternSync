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
  const fullSizes = {
    sm: 'h-7 w-auto max-w-[135px]',
    md: 'h-9 w-auto max-w-[165px]',
    lg: 'h-11 sm:h-12 w-auto max-w-[210px]',
  }

  const markSizes = {
    sm: 'w-7 h-7',
    md: 'w-8 h-8',
    lg: 'w-11 h-11',
  }

  const isDark = variant === 'dark'
  const isMarkOnly = variant === 'mark'

  const content = (
    <div className={cn('inline-flex items-center select-none group', className)}>
      {isMarkOnly ? (
        <img
          src="/brand/internsync-symbol.png"
          alt="InternSync"
          className={cn(
            'object-contain shrink-0 group-hover:scale-105 transition-transform duration-200',
            markSizes[size]
          )}
        />
      ) : (
        <img
          src={isDark ? '/brand/internsync-logo-dark.png' : '/brand/internsync-logo.png'}
          alt="InternSync"
          className={cn(
            'object-contain shrink-0 group-hover:scale-105 transition-transform duration-200',
            fullSizes[size]
          )}
        />
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
