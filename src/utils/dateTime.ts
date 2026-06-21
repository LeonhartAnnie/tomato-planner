import { addDays, addMinutes, format, parseISO, startOfDay } from 'date-fns'

const toDate = (isoString: string): Date => {
  const date = parseISO(isoString)

  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid ISO date: ${isoString}`)
  }

  return date
}

export const nowIso = (): string => new Date().toISOString()

export const addMinutesIso = (startIso: string, minutes: number): string =>
  addMinutes(toDate(startIso), minutes).toISOString()

export const addDaysIso = (startIso: string, days: number): string =>
  addDays(toDate(startIso), days).toISOString()

export const startOfDayIso = (isoString = nowIso()): string =>
  startOfDay(toDate(isoString)).toISOString()

export { isOverlapping } from '../domain/schedule/scheduleRules'

export const toIsoString = (date: Date): string => date.toISOString()

export const formatDateTime = (isoString: string): string =>
  format(toDate(isoString), 'yyyy/MM/dd HH:mm')

export const formatTime = (isoString: string): string =>
  format(toDate(isoString), 'HH:mm')

export const toDateTimeLocalValue = (isoString?: string): string =>
  isoString ? format(toDate(isoString), "yyyy-MM-dd'T'HH:mm") : ''

export const fromDateTimeLocalValue = (value: string): string | undefined =>
  value ? new Date(value).toISOString() : undefined
