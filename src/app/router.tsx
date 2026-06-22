import { lazy, Suspense, type ReactNode } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { AppLayout } from '../components/AppLayout'
import { PageLoading } from '../components/PageLoading'

const DashboardPage = lazy(() =>
  import('../pages/DashboardPage').then((module) => ({
    default: module.DashboardPage,
  })),
)
const TasksPage = lazy(() =>
  import('../pages/TasksPage').then((module) => ({
    default: module.TasksPage,
  })),
)
const SchedulePage = lazy(() =>
  import('../pages/SchedulePage').then((module) => ({
    default: module.SchedulePage,
  })),
)
const PomodoroPage = lazy(() =>
  import('../pages/PomodoroPage').then((module) => ({
    default: module.PomodoroPage,
  })),
)
const SettingsPage = lazy(() =>
  import('../pages/SettingsPage').then((module) => ({
    default: module.SettingsPage,
  })),
)
const PrivacyPage = lazy(() =>
  import('../pages/PrivacyPage').then((module) => ({
    default: module.PrivacyPage,
  })),
)
const TermsPage = lazy(() =>
  import('../pages/TermsPage').then((module) => ({
    default: module.TermsPage,
  })),
)

const withPageLoading = (page: ReactNode) => (
  <Suspense fallback={<PageLoading />}>{page}</Suspense>
)

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: withPageLoading(<DashboardPage />) },
      { path: 'tasks', element: withPageLoading(<TasksPage />) },
      { path: 'schedule', element: withPageLoading(<SchedulePage />) },
      { path: 'pomodoro', element: withPageLoading(<PomodoroPage />) },
      { path: 'settings', element: withPageLoading(<SettingsPage />) },
      { path: 'privacy', element: withPageLoading(<PrivacyPage />) },
      { path: 'terms', element: withPageLoading(<TermsPage />) },
    ],
  },
])
