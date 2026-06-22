import { addDays, format, isValid, parseISO, startOfDay } from 'date-fns'
import { nowIso } from '../../../utils/dateTime'

export type ScheduleViewRangeMode = 'day' | 'three-days' | 'seven-days'

export interface ScheduleViewRange {
  mode: ScheduleViewRangeMode
  anchorDateKey: string
  dateKeys: string[]
  canGoPrevious: boolean
  canGoNext: boolean
  label: string
}

const VISIBLE_DAYS: Record<ScheduleViewRangeMode, number> = {
  day: 1,
  'three-days': 3,
  'seven-days': 7,
}

const toDate = (value: string): Date => {
  const date = parseISO(value)
  if (!isValid(date)) {
    throw new Error(`Invalid schedule view date: ${value}`)
  }
  return date
}

const toDateKey = (date: Date): string => format(date, 'yyyy-MM-dd')
const toLabel = (dateKey: string): string => format(toDate(dateKey), 'yyyy/MM/dd')

export const createScheduleViewRange = (
  mode: ScheduleViewRangeMode,
  anchorDateKey?: string,
  baseDateIso = nowIso(),
): ScheduleViewRange => {
  const baseDate = startOfDay(toDate(baseDateIso))
  const baseDateKey = toDateKey(baseDate)
  const visibleDays = VISIBLE_DAYS[mode]
  const maximumAnchor = addDays(baseDate, 7 - visibleDays)
  const requestedAnchor = mode === 'seven-days'
    ? baseDate
    : startOfDay(toDate(anchorDateKey ?? baseDateKey))
  const clampedAnchor = requestedAnchor < baseDate
    ? baseDate
    : requestedAnchor > maximumAnchor
      ? maximumAnchor
      : requestedAnchor
  const normalizedAnchor = toDateKey(clampedAnchor)
  const dateKeys = Array.from({ length: visibleDays }, (_, index) =>
    toDateKey(addDays(clampedAnchor, index)),
  )
  const lastDateKey = dateKeys.at(-1) ?? normalizedAnchor

  return {
    mode,
    anchorDateKey: normalizedAnchor,
    dateKeys,
    canGoPrevious: mode !== 'seven-days' && normalizedAnchor > baseDateKey,
    canGoNext:
      mode !== 'seven-days' &&
      lastDateKey < toDateKey(addDays(baseDate, 6)),
    label:
      dateKeys.length === 1
        ? toLabel(normalizedAnchor)
        : `${toLabel(normalizedAnchor)} – ${toLabel(lastDateKey)}`,
  }
}

export const shiftScheduleViewRange = (
  range: ScheduleViewRange,
  direction: -1 | 1,
  baseDateIso = nowIso(),
): ScheduleViewRange =>
  createScheduleViewRange(
    range.mode,
    toDateKey(addDays(toDate(range.anchorDateKey), direction)),
    baseDateIso,
  )
