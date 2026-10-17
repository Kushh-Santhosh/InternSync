import React, { useState, useEffect } from 'react'
import { User } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export interface UserAvatarProps {
  name?: string
  fullName?: string
  avatarUrl?: string | null
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  shape?: 'circle' | 'rounded'
}

const SIZE_MAP = {
  xs: { box: 'w-6 h-6', text: 'text-[10px]', icon: 'w-3 h-3' },
  sm: { box: 'w-8 h-8', text: 'text-xs', icon: 'w-4 h-4' },
  md: { box: 'w-10 h-10', text: 'text-sm', icon: 'w-5 h-5' },
  lg: { box: 'w-14 h-14', text: 'text-base', icon: 'w-7 h-7' },
  xl: { box: 'w-16 h-16', text: 'text-lg', icon: 'w-8 h-8' },
}

function getInitials(name?: string): string {
  if (!name || !name.trim()) return ''
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

// Generate consistent background color based on name string
function getAvatarGradient(name?: string): string {
  if (!name) return 'from-indigo-600 to-violet-600'
  const gradients = [
    'from-indigo-600 to-violet-600',
    'from-violet-600 to-purple-600',
    'from-blue-600 to-indigo-600',
    'from-emerald-600 to-teal-600',
    'from-teal-600 to-cyan-600',
    'from-rose-600 to-pink-600',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % gradients.length
  return gradients[index]
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  name = '',
  fullName = '',
  avatarUrl,
  size = 'sm',
  className,
  shape = 'circle',
}) => {
  const [hasError, setHasError] = useState(false)
  const cleanUrl = avatarUrl?.trim()
  const effectiveName = (name || fullName || '').trim()

  // Reset error state whenever the URL changes
  useEffect(() => {
    setHasError(false)
  }, [cleanUrl])

  const { box, text, icon } = SIZE_MAP[size] || SIZE_MAP.sm
  const shapeClass = shape === 'circle' ? 'rounded-full' : 'rounded-2xl'
  const initials = getInitials(effectiveName)
  const gradient = getAvatarGradient(effectiveName)

  if (cleanUrl && !hasError) {
    return (
      <div
        className={cn(
          'relative shrink-0 overflow-hidden bg-slate-100 border border-slate-200 shadow-2xs',
          box,
          shapeClass,
          className
        )}
      >
        <img
          src={cleanUrl}
          alt={name ? `${name}'s avatar` : 'User avatar'}
          onError={() => setHasError(true)}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
    )
  }

  // Graceful Fallback: Initials or Default Person Icon
  return (
    <div
      className={cn(
        'shrink-0 flex items-center justify-center font-bold text-white shadow-2xs select-none bg-gradient-to-tr border border-white/20',
        gradient,
        box,
        text,
        shapeClass,
        className
      )}
      title={name || 'User Profile'}
      aria-label={name ? `${name}'s avatar` : 'User avatar'}
    >
      {initials ? (
        <span className="tracking-wider leading-none">{initials}</span>
      ) : (
        <User className={cn(icon, 'opacity-90')} />
      )}
    </div>
  )
}
