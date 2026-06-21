import { isOverlapping } from '../../domain/schedule/scheduleRules'
import type { CalendarEvent, ScheduledBlock } from '../../types'

export interface ScheduleTimeRange {
  start: string
  end: string
}

export interface ScheduleConflict {
  id: string
  title: string
  start: string
  end: string
  source: 'scheduled_block' | 'calendar_event'
}

const overlapsTarget = (
  target: ScheduleTimeRange,
  item: ScheduleTimeRange,
): boolean => isOverlapping(target.start, target.end, item.start, item.end)

export const checkScheduleConflict = (
  target: ScheduleTimeRange,
  scheduledBlocks: ScheduledBlock[],
  calendarEvents: CalendarEvent[],
): ScheduleConflict[] => {
  const blockConflicts: ScheduleConflict[] = scheduledBlocks
    .filter((block) => overlapsTarget(target, block))
    .map((block) => ({
      id: block.id,
      title: block.title,
      start: block.start,
      end: block.end,
      source: 'scheduled_block',
    }))

  const eventConflicts: ScheduleConflict[] = calendarEvents
    .filter((event) => overlapsTarget(target, event))
    .map((event) => ({
      id: event.id,
      title: event.title,
      start: event.start,
      end: event.end,
      source: 'calendar_event',
    }))

  return [...blockConflicts, ...eventConflicts]
}
