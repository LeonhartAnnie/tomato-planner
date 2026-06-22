export interface OnboardingSnapshot {
  taskCount: number
  scheduledBlockCount: number
  pomodoroSessionCount: number
  calendarEventCount: number
  hasDriveBackupStatus: boolean
}

export type OnboardingStepId =
  | 'create-task'
  | 'schedule-task'
  | 'start-pomodoro'
  | 'connect-calendar'
  | 'setup-backup'

export type OnboardingStepStatus = 'done' | 'next' | 'optional' | 'locked'

export interface OnboardingStep {
  id: OnboardingStepId
  title: string
  description: string
  status: OnboardingStepStatus
  href?: string
}

const getMainFlowStatuses = (
  snapshot: OnboardingSnapshot,
): OnboardingStepStatus[] => {
  if (snapshot.taskCount === 0) return ['next', 'locked', 'locked']
  if (snapshot.scheduledBlockCount === 0) return ['done', 'next', 'locked']
  if (snapshot.pomodoroSessionCount === 0) return ['done', 'done', 'next']
  return ['done', 'done', 'done']
}

export const getOnboardingSteps = (
  snapshot: OnboardingSnapshot,
): OnboardingStep[] => {
  const [taskStatus, scheduleStatus, pomodoroStatus] =
    getMainFlowStatuses(snapshot)

  return [
    {
      id: 'create-task',
      title: '建立任務',
      description: '先記下要完成的事情與預估時間。',
      status: taskStatus,
      href: '/tasks',
    },
    {
      id: 'schedule-task',
      title: '安排排程',
      description: '把任務拖到日期或時間格線，確認執行時間。',
      status: scheduleStatus,
      href: '/schedule',
    },
    {
      id: 'start-pomodoro',
      title: '開始番茄鐘',
      description: '從排程開始一輪專注，完成後安排休息。',
      status: pomodoroStatus,
      href: '/pomodoro',
    },
    {
      id: 'connect-calendar',
      title: '匯入 Google Calendar（選用）',
      description: '以唯讀方式查看未來 7 天外部行程。',
      status: snapshot.calendarEventCount > 0 ? 'done' : 'optional',
      href: '/schedule',
    },
    {
      id: 'setup-backup',
      title: '設定 Google Drive 備份（選用）',
      description: '手動備份本機資料，並在需要時安全還原。',
      status: snapshot.hasDriveBackupStatus ? 'done' : 'optional',
      href: '/settings',
    },
  ]
}

export const isMainOnboardingComplete = (
  steps: OnboardingStep[],
): boolean => steps.slice(0, 3).every((step) => step.status === 'done')
