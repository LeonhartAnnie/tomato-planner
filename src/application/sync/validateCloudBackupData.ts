import { isValid, parseISO } from 'date-fns'
import type { CloudBackupData } from './syncTypes'

const forbiddenBackupKeys = [
  'calendarEvents',
  'activeTimer',
  'nextStep',
  'lastCompletedSession',
] as const

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)

const isValidIsoDate = (value: unknown): value is string =>
  typeof value === 'string' && isValid(parseISO(value))

const isTask = (value: unknown): boolean =>
  isRecord(value) &&
  typeof value.id === 'string' &&
  typeof value.title === 'string' &&
  isFiniteNumber(value.estimatedMinutes) &&
  typeof value.splittable === 'boolean' &&
  isValidIsoDate(value.createdAt) &&
  isValidIsoDate(value.updatedAt)

const isScheduledBlock = (value: unknown): boolean =>
  isRecord(value) &&
  typeof value.id === 'string' &&
  typeof value.taskId === 'string' &&
  typeof value.title === 'string' &&
  isValidIsoDate(value.start) &&
  isValidIsoDate(value.end) &&
  (value.source === 'manual' || value.source === 'suggested') &&
  typeof value.syncedToGoogleCalendar === 'boolean' &&
  isValidIsoDate(value.createdAt) &&
  isValidIsoDate(value.updatedAt)

const isSettings = (value: unknown): boolean =>
  isRecord(value) &&
  isFiniteNumber(value.workMinutes) &&
  isFiniteNumber(value.shortBreakMinutes) &&
  isFiniteNumber(value.longBreakMinutes) &&
  isFiniteNumber(value.longBreakInterval) &&
  isFiniteNumber(value.calendarViewStartHour) &&
  isFiniteNumber(value.calendarViewEndHour) &&
  isFiniteNumber(value.defaultTaskDurationMinutes)

const isPomodoroSession = (value: unknown): boolean =>
  isRecord(value) &&
  typeof value.id === 'string' &&
  (value.type === 'focus' ||
    value.type === 'short_break' ||
    value.type === 'long_break') &&
  isValidIsoDate(value.startedAt) &&
  typeof value.completed === 'boolean' &&
  (value.endedAt === undefined || isValidIsoDate(value.endedAt))

export const isCloudBackupData = (value: unknown): value is CloudBackupData =>
  isRecord(value) &&
  !forbiddenBackupKeys.some((key) => key in value) &&
  value.version === 1 &&
  isValidIsoDate(value.updatedAt) &&
  Array.isArray(value.tasks) &&
  value.tasks.every(isTask) &&
  Array.isArray(value.scheduledBlocks) &&
  value.scheduledBlocks.every(isScheduledBlock) &&
  isSettings(value.settings) &&
  Array.isArray(value.pomodoroSessions) &&
  value.pomodoroSessions.every(isPomodoroSession)

export const assertCloudBackupData = (value: unknown): CloudBackupData => {
  if (!isCloudBackupData(value)) {
    if (isRecord(value) && 'version' in value && value.version !== 1) {
      throw new Error(`Unsupported cloud backup version: ${String(value.version)}`)
    }
    throw new Error('Invalid CloudBackupData')
  }
  return value
}
