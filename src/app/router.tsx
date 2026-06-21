import { createBrowserRouter } from 'react-router-dom'
import { AppLayout } from '../components/AppLayout'
import {
  DashboardPage,
  PomodoroPage,
  SchedulePage,
  SettingsPage,
  TasksPage,
} from '../pages'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'tasks', element: <TasksPage /> },
      { path: 'schedule', element: <SchedulePage /> },
      { path: 'pomodoro', element: <PomodoroPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
])
