import type { Settings } from '../../types'

const assertFinite = (value: number, fieldName: string): void => {
  if (!Number.isFinite(value)) {
    throw new Error(`${fieldName} must be a finite number`)
  }
}

export const validateSettings = (settings: Settings): void => {
  assertFinite(settings.workMinutes, 'workMinutes')
  assertFinite(settings.shortBreakMinutes, 'shortBreakMinutes')
  assertFinite(settings.longBreakMinutes, 'longBreakMinutes')
  assertFinite(settings.longBreakInterval, 'longBreakInterval')
  assertFinite(settings.calendarViewStartHour, 'calendarViewStartHour')
  assertFinite(settings.calendarViewEndHour, 'calendarViewEndHour')
  assertFinite(
    settings.defaultTaskDurationMinutes,
    'defaultTaskDurationMinutes',
  )

  if (settings.workMinutes <= 0) {
    throw new Error('workMinutes must be greater than zero')
  }

  if (settings.shortBreakMinutes < 0) {
    throw new Error('shortBreakMinutes cannot be negative')
  }

  if (settings.longBreakMinutes < 0) {
    throw new Error('longBreakMinutes cannot be negative')
  }

  if (settings.longBreakInterval <= 0) {
    throw new Error('longBreakInterval must be greater than zero')
  }

  if (settings.defaultTaskDurationMinutes <= 0) {
    throw new Error('defaultTaskDurationMinutes must be greater than zero')
  }

  if (settings.calendarViewStartHour < 0) {
    throw new Error('calendarViewStartHour cannot be negative')
  }

  if (settings.calendarViewEndHour > 24) {
    throw new Error('calendarViewEndHour cannot be greater than 24')
  }

  if (settings.calendarViewEndHour <= settings.calendarViewStartHour) {
    throw new Error('calendarViewEndHour must be after calendarViewStartHour')
  }
}
