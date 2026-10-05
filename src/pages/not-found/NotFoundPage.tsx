import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Compass } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
        <Compass className="w-8 h-8" />
      </div>
      <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">404 — Page Not Found</h1>
      <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-sm">
        The route you are looking for does not exist or has been moved.
      </p>
      <Link to="/dashboard" className="mt-6">
        <Button size="md" className="bg-indigo-600 text-white">
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          <span>Return to Dashboard</span>
        </Button>
      </Link>
    </div>
  )
}
