import { createBrowserRouter } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { ApplicationsPage } from '@/pages/applications/ApplicationsPage'
import { SkillLabPage } from '@/pages/assessments/SkillLabPage'
import { AssistantPage } from '@/pages/assistant/AssistantPage'
import { CareerDnaPage } from '@/pages/career/CareerDnaPage'
import { CareerPathsPage } from '@/pages/career/CareerPathsPage'
import { DashboardPage } from '@/pages/dashboard/DashboardPage'
import { LandingPage } from '@/pages/landing/LandingPage'
import { LoginPage } from '@/pages/auth/LoginPage'
import { SignupPage } from '@/pages/auth/SignupPage'
import { PrivacyPage } from '@/pages/legal/PrivacyPage'
import { TermsPage } from '@/pages/legal/TermsPage'
import { NotFoundPage } from '@/pages/not-found/NotFoundPage'
import { OnboardingPage } from '@/pages/onboarding/OnboardingPage'
import { OpportunitiesPage } from '@/pages/opportunities/OpportunitiesPage'
import { OpportunityDetailPage } from '@/pages/opportunities/OpportunityDetailPage'
import { ProfilePage } from '@/pages/profile/ProfilePage'
import { SettingsPage } from '@/pages/settings/SettingsPage'
import { DreamInternshipPage } from '@/pages/dream/DreamInternshipPage'

export const router = createBrowserRouter([
  // Public Routes
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/signup',
    element: <SignupPage />,
  },
  {
    path: '/privacy',
    element: <PrivacyPage />,
  },
  {
    path: '/terms',
    element: <TermsPage />,
  },

  // Protected Onboarding
  {
    path: '/onboarding',
    element: (
      <ProtectedRoute>
        <OnboardingPage />
      </ProtectedRoute>
    ),
  },

  // Protected App Shell Routes
  {
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      {
        path: '/dashboard',
        element: <DashboardPage />,
      },
      {
        path: '/career-dna',
        element: <CareerDnaPage />,
      },
      {
        path: '/opportunities',
        element: <OpportunitiesPage />,
      },
      {
        path: '/opportunities/:id',
        element: <OpportunityDetailPage />,
      },
      {
        path: '/skill-lab',
        element: <SkillLabPage />,
      },
      {
        path: '/career-paths',
        element: <CareerPathsPage />,
      },
      {
        path: '/dream-internship',
        element: <DreamInternshipPage />,
      },
      {
        path: '/applications',
        element: <ApplicationsPage />,
      },
      {
        path: '/assistant',
        element: <AssistantPage />,
      },
      {
        path: '/profile',
        element: <ProfilePage />,
      },
      {
        path: '/settings',
        element: <SettingsPage />,
      },
    ],
  },
  {
    path: '/404',
    element: <NotFoundPage />,
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
])
