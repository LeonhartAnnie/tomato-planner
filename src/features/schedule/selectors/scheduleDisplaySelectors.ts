import { addDays, format, parseISO } from 'date-fns'
import { isOverlapping } from '../../../domain/schedule/scheduleRules'
import type { CalendarEvent, ScheduledBlock } from '../../../types'
import { nowIso, formatTime } from '../../../utils/dateTime'

export interface ScheduleDayGroup {
  dateKey: string
  blocks: ScheduledBlock[]
}

export interface ScheduleConflictSummary {
  id: string
  title: string
  start: string
  end: string
  kind: 'scheduled_block' | 'calendar_event'
}

type ScheduleDisplayItemData =
  | {
      kind: 'scheduled_block'
      id: string
      title: string
      start: string
      end: string
      block: ScheduledBlock
    }
  | {
      kind: 'calendar_event'
      id: string
      title: string
      start: string
      end: string
      event: CalendarEvent
      readonly: true
    }

export type ScheduleDisplayItem = ScheduleDisplayItemData & {
  hasConflict: boolean
  conflicts: ScheduleConflictSummary[]
}

export interface ScheduleDayDisplayGroup {
  dateKey: string
  items: ScheduleDisplayItem[]
}

const toDateKey = (isoString: string): string =>
  format(parseISO(isoString), 'yyyy-MM-dd')

export const getNextSevenDays = (baseDateIso = nowIso()): string[] => {
  const baseDate = parseISO(baseDateIso)
  return Array.from({ length: 7 }, (_, index) =>
    format(addDays(baseDate, index), 'yyyy-MM-dd'),
  )
}

export const groupScheduledBlocksByDate = (
  blocks: ScheduledBlock[],
  dateKeys: string[],
): ScheduleDayGroup[] => {
  const allowedDates = new Set(dateKeys)
  const blocksByDate = new Map<string, ScheduledBlock[]>()

  for (const block of blocks) {
    const dateKey = toDateKey(block.start)
    if (!allowedDates.has(dateKey)) {
      continue
    }

    const dateBlocks = blocksByDate.get(dateKey) ?? []
    dateBlocks.push(block)
    blocksByDate.set(dateKey, dateBlocks)
  }

  return dateKeys.map((dateKey) => ({
    dateKey,
    blocks: [...(blocksByDate.get(dateKey) ?? [])].sort(
      (first, second) =>
        parseISO(first.start).getTime() - parseISO(second.start).getTime(),
    ),
  }))
}

export const groupScheduleItemsByDate = (
  blocks: ScheduledBlock[],
  calendarEvents: CalendarEvent[],
  dateKeys: string[],
): ScheduleDayDisplayGroup[] => {
  const allowedDates = new Set(dateKeys)
  const itemsByDate = new Map<string, ScheduleDisplayItem[]>()
  const displayItems = createScheduleDisplayItems(blocks, calendarEvents)

  for (const item of displayItems) {
    const dateKey = toDateKey(item.start)
    if (!allowedDates.has(dateKey)) {
      continue
    }

    const dateItems = itemsByDate.get(dateKey) ?? []
    dateItems.push(item)
    itemsByDate.set(dateKey, dateItems)
  }

  return dateKeys.map((dateKey) => ({
    dateKey,
    items: addConflictInfoToScheduleItems(
      [...(itemsByDate.get(dateKey) ?? [])].sort((first, second) => {
        const startDifference =
          parseISO(first.start).getTime() - parseISO(second.start).getTime()
        if (startDifference !== 0) {
          return startDifference
        }
        if (first.kind === second.kind) {
          return 0
        }
        return first.kind === 'calendar_event' ? -1 : 1
      }),
    ),
  }))
}

export const createScheduleDisplayItems = (
  blocks: ScheduledBlock[],
  calendarEvents: CalendarEvent[],
): ScheduleDisplayItem[] => [
    ...blocks.map((block) => ({
      kind: 'scheduled_block' as const,
      id: block.id,
      title: block.title,
      start: block.start,
      end: block.end,
      block,
      hasConflict: false,
      conflicts: [],
    })),
    ...calendarEvents.map((event) => ({
      kind: 'calendar_event' as const,
      id: event.id,
      title: event.title,
      start: event.start,
      end: event.end,
      event,
      readonly: true as const,
      hasConflict: false,
      conflicts: [],
    })),
  ]

const toConflictSummary = (
  item: ScheduleDisplayItem,
): ScheduleConflictSummary => ({
  id: item.id,
  title: item.title,
  start: item.start,
  end: item.end,
  kind: item.kind,
})

const addUniqueConflict = (
  conflicts: ScheduleConflictSummary[],
  conflict: ScheduleConflictSummary,
): void => {
  const alreadyExists = conflicts.some(
    (item) => item.id === conflict.id && item.kind === conflict.kind,
  )
  if (!alreadyExists) {
    conflicts.push(conflict)
  }
}

export const addConflictInfoToScheduleItems = (
  items: ScheduleDisplayItem[],
): ScheduleDisplayItem[] => {
  const enrichedItems = items.map((item) => ({
    ...item,
    hasConflict: false,
    conflicts: [],
  }))

  for (let firstIndex = 0; firstIndex < enrichedItems.length; firstIndex += 1) {
    const first = enrichedItems[firstIndex]
    for (
      let secondIndex = firstIndex + 1;
      secondIndex < enrichedItems.length;
      secondIndex += 1
    ) {
      const second = enrichedItems[secondIndex]
      if (!isOverlapping(first.start, first.end, second.start, second.end)) {
        continue
      }

      addUniqueConflict(first.conflicts, toConflictSummary(second))
      addUniqueConflict(second.conflicts, toConflictSummary(first))
      first.hasConflict = true
      second.hasConflict = true
    }
  }

  return enrichedItems
}

export const formatScheduleTimeRange = (
  startIso: string,
  endIso: string,
): string => `${formatTime(startIso)}–${formatTime(endIso)}`
