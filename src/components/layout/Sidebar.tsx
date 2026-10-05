import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  BrainCircuit,
  Briefcase,
  Compass,
  FileCheck2,
  KanbanSquare,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Settings,
  Sparkles,
  User,
} from 'lucide-react'
import { useApp } from '@/app/context'
import { cn } from '@/lib/utils/cn'
import { InternSyncLogo } from '@/components/brand/InternSyncLogo'

interface SidebarProps {
  className?: string
  onCloseMobile?: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({ className, onCloseMobile = () => {} }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { profile, applications, logout } = useApp()

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Career DNA', icon: BrainCircuit, path: '/career-dna' },
    { label: 'Opportunities', icon: Briefcase, path: '/opportunities' },
    { label: 'Dream Role', icon: Sparkles, path: '/dream-internship' },
    { label: 'Skill Lab', icon: FileCheck2, path: '/skill-lab' },
    { label: 'Career Paths', icon: Compass, path: '/career-paths' },
    {
      label: 'Applications',
      icon: KanbanSquare,
      path: '/applications',
      badge: applications.length > 0 ? applications.length : undefined,
    },
    { label: 'Career Assistant', icon: MessageSquare, path: '/assistant' },
  ]

  const secondaryItems = [
    { label: 'Profile', icon: User, path: '/profile' },
    { label: 'Settings', icon: Settings, path: '/settings' },
  ]

  return (
    <aside
      className={cn(
        'w-64 h-screen bg-white border-r border-slate-200/80 flex flex-col justify-between select-none z-30',
        className
      )}
    >
      {/* Top Header & Branding */}
      <div>
        <div className="h-16 flex items-center px-5 border-b border-slate-100">
          <InternSyncLogo variant="full" size="sm" to="/dashboard" />
        </div>


        {/* Main Navigation List */}
        <nav className="p-3 space-y-1">
          <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Workspace
          </div>
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onCloseMobile}
                className={cn(
                  'flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer',
                  isActive
                    ? 'bg-slate-900 text-white font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={cn(
                      'w-4 h-4 transition-colors',
                      isActive ? 'text-white' : 'text-slate-500'
                    )}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={cn(
                      'text-[10px] font-bold px-1.5 py-0.2 rounded-full',
                      isActive ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-600'
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Secondary Navigation */}
        <div className="px-3 pt-2">
          <div className="border-t border-slate-100 pt-2 space-y-1">
            <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Account
            </div>
            {secondaryItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={onCloseMobile}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer',
                    isActive
                      ? 'bg-slate-900 text-white font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  )}
                >
                  <Icon className="w-4 h-4 text-slate-400" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      {/* User Footer Profile */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <Link
          to="/profile"
          onClick={onCloseMobile}
          className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-white border border-transparent hover:border-slate-200 transition-all cursor-pointer min-w-0 flex-1"
        >
          <img
            src={profile.avatarUrl}
            alt={profile.fullName}
            className="w-7 h-7 rounded-full object-cover border border-slate-200"
          />
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold text-slate-900 truncate">{profile.fullName}</div>
            <div className="text-[10px] text-slate-500 truncate">
              {profile.degree} · Year {profile.currentYear}
            </div>
          </div>
        </Link>
        <button
          onClick={() => {
            onCloseMobile()
            logout()
            navigate('/login')
          }}
          title="Sign out"
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white transition-all ml-1"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  )
}
