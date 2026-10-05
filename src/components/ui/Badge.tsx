import React from 'react'
import { cn } from '@/lib/utils/cn'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'danger' | 'accent'
  size?: 'sm' | 'md'
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  size = 'md',
  children,
  ...props
}) => {
  const variantStyles = {
    default: 'bg-slate-900 text-white border-transparent',
    secondary: 'bg-slate-100 text-slate-800 border-slate-200',
    outline: 'border-slate-300 text-slate-700 bg-white',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    accent: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  }

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-medium',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border transition-colors',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
