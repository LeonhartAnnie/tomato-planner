import type { Settings } from '../../../types'

export type SettingsFormValues = {
  [Key in keyof Settings]: string
}

const parseNumber = (value: string): number =>
  value.trim() === '' ? Number.NaN : Number(value)

export const settingsToFormValues = (
  settings: Settings,
): SettingsFormValues => ({
  workMinutes: settings.workMinutes.toString(),
  shortBreakMinutes: settings.shortBreakMinutes.toString(),
  longBreakMinutes: settings.longBreakMinutes.toString(),
  longBreakInterval: settings.longBreakInterval.toString(),
  calendarViewStartHour: settings.calendarViewStartHour.toString(),
  calendarViewEndHour: settings.calendarViewEndHour.toString(),
  defaultTaskDurationMinutes: settings.defaultTaskDurationMinutes.toString(),
})

export const settingsFormValuesToSettings = (
  values: SettingsFormValues,
): Settings => ({
  workMinutes: parseNumber(values.workMinutes),
  shortBreakMinutes: parseNumber(values.shortBreakMinutes),
  longBreakMinutes: parseNumber(values.longBreakMinutes),
  longBreakInterval: parseNumber(values.longBreakInterval),
  calendarViewStartHour: parseNumber(values.calendarViewStartHour),
  calendarViewEndHour: parseNumber(values.calendarViewEndHour),
  defaultTaskDurationMinutes: parseNumber(values.defaultTaskDurationMinutes),
})
