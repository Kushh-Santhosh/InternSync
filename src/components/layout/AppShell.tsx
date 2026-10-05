import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { CommandPalette } from '@/components/common/CommandPalette'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

export const AppShell: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-[#f8fafc] text-slate-900 font-sans">
      {/* Desktop Sidebar */}
      <Sidebar className="hidden md:flex shrink-0 sticky top-0" />

      {/* Mobile Drawer Backdrop & Sidebar */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <Sidebar
            className="relative z-10 w-72 h-full shadow-2xl"
            onCloseMobile={() => setIsMobileMenuOpen(false)}
          />
        </div>
      )}

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-in fade-in duration-150">
          <Outlet />
        </main>
      </div>

      {/* Global Command Palette (Cmd + K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />
    </div>
  )
}
