export interface Task {
  id: string
  title: string
  estimatedMinutes: number
  category?: string
  location?: string
  note?: string
  deadline?: string
  splittable: boolean
  createdAt: string
  updatedAt: string
}

export interface ScheduledBlock {
  id: string
  taskId: string
  title: string
  start: string
  end: string
  source: 'manual' | 'suggested'
  syncedToGoogleCalendar: boolean
  createdAt: string
  updatedAt: string
}

export interface CalendarEvent {
  id: string
  title: string
  start: string
  end: string
  location?: string
  source: 'google_calendar'
  readonly: true
}

export interface PomodoroSession {
  id: string
  taskId?: string
  scheduledBlockId?: string
  type: 'focus' | 'short_break' | 'long_break'
  startedAt: string
  endedAt?: string
  completed: boolean
}

export type PomodoroTimerStatus = 'idle' | 'running' | 'paused' | 'completed'

export interface PomodoroTimer {
  id: string
  taskId?: string
  scheduledBlockId?: string
  type: 'focus' | 'short_break' | 'long_break'
  status: PomodoroTimerStatus
  startedAt: string
  targetEndAt: string
  durationMinutes: number
  pausedAt?: string
  remainingSecondsWhenPaused?: number
  completed: boolean
}

export interface Settings {
  workMinutes: number
  shortBreakMinutes: number
  longBreakMinutes: number
  longBreakInterval: number
  calendarViewStartHour: number
  calendarViewEndHour: number
  defaultTaskDurationMinutes: number
}

export type SettingsRecord = Settings & { id: 'default' }
