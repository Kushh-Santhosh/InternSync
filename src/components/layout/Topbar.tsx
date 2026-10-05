import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Bell,
  Columns3,
  Menu,
  Search,
  Settings,
  Sparkles,
} from 'lucide-react'
import { useApp } from '@/app/context'
import { Button } from '@/components/ui/Button'

interface TopbarProps {
  onOpenMobileMenu: () => void
  onOpenCommandPalette: () => void
}

export const Topbar: React.FC<TopbarProps> = ({
  onOpenMobileMenu,
  onOpenCommandPalette,
}) => {
  const navigate = useNavigate()
  const { comparisonIds, profile } = useApp()

  return (
    <header className="h-16 border-b border-slate-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-20 px-4 md:px-8 flex items-center justify-between">
      {/* Left: Mobile Toggle & Search Trigger */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Quick Search Button */}
        <button
          onClick={onOpenCommandPalette}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-slate-100/80 text-slate-500 hover:text-slate-800 text-xs transition-colors cursor-pointer w-48 sm:w-64"
        >
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <span className="flex-1 text-left">Search or ask anything...</span>
          <kbd className="hidden sm:inline-block text-[10px] font-semibold text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-2xs">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {profile.fullName && (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-50 border border-slate-200/80 text-slate-600">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Profile ready</span>
          </div>
        )}

        {/* Comparison floating button if active */}
        {comparisonIds.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/opportunities?compare=true')}
            className="border-indigo-200 text-indigo-700 bg-indigo-50/50 hover:bg-indigo-100/70 text-xs"
          >
            <Columns3 className="w-3.5 h-3.5 mr-1" />
            <span>Compare ({comparisonIds.length})</span>
          </Button>
        )}

        {/* AI Assistant Quick Pill */}
        <Link to="/assistant">
          <Button variant="ghost" size="sm" className="hidden sm:inline-flex text-indigo-700 bg-indigo-50/50 hover:bg-indigo-100/60 text-xs">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 mr-1" />
            <span>Ask Assistant</span>
          </Button>
        </Link>

        {/* Settings Link */}
        <Link
          to="/settings"
          title="Integrations & API Settings"
          className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <Settings className="w-4 h-4" />
        </Link>

        {/* Notification Bell */}
        <button
          title="Notifications"
          className="relative p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-600" />
        </button>

        {/* Avatar link */}
        <Link to="/profile" className="cursor-pointer">
          <img
            src={profile.avatarUrl}
            alt={profile.fullName}
            className="w-8 h-8 rounded-full object-cover border border-slate-200 hover:ring-2 hover:ring-indigo-500/30 transition-all"
          />
        </Link>
      </div>
    </header>
  )
}
