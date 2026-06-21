import { addDays, addHours, format, parseISO, startOfDay } from 'date-fns'
import type { CalendarEvent, ScheduledBlock } from '../../types'
import { nowIso } from '../../utils/dateTime'

const createEvent = (
  id: string,
  title: string,
  start: Date,
  end: Date,
): CalendarEvent => ({
  id,
  title,
  start: start.toISOString(),
  end: end.toISOString(),
  source: 'google_calendar',
  readonly: true,
})

// Local development fixtures only; replace this factory when calendar sync exists.
export const createSampleCalendarEvents = (
  conflictBlock?: ScheduledBlock,
  baseDateIso = nowIso(),
): CalendarEvent[] => {
  const today = startOfDay(parseISO(baseDateIso))
  const tomorrow = addDays(today, 1)
  const dateKey = format(today, 'yyyy-MM-dd')
  const conflictStart = conflictBlock
    ? parseISO(conflictBlock.start)
    : addHours(today, 14)
  const conflictEnd = conflictBlock
    ? parseISO(conflictBlock.end)
    : addHours(today, 15)

  return [
    createEvent(
      `sample-today-${dateKey}`,
      '外部晨間會議',
      addHours(today, 9),
      addHours(today, 10),
    ),
    createEvent(
      `sample-tomorrow-${dateKey}`,
      '外部專案同步',
      addHours(tomorrow, 11),
      addHours(tomorrow, 12),
    ),
    createEvent(
      `sample-conflict-${dateKey}`,
      '可能衝突的外部行程',
      conflictStart,
      conflictEnd,
    ),
  ]
}
