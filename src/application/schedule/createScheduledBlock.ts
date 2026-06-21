import { assertValidTimeRange } from '../../domain/schedule/scheduleRules'
import type { CalendarEvent, ScheduledBlock } from '../../types'
import { nowIso } from '../../utils/dateTime'
import { createId } from '../../utils/id'
import type { ScheduleRepository } from './scheduleRepository'
import { checkScheduleConflict } from './checkScheduleConflict'

export interface CreateScheduledBlockInput {
  taskId: string
  title: string
  start: string
  end: string
  source?: 'manual' | 'suggested'
  syncedToGoogleCalendar?: boolean
}

export const createScheduledBlock = async (
  input: CreateScheduledBlockInput,
  repository: ScheduleRepository,
  existingBlocks: ScheduledBlock[] = [],
  existingCalendarEvents: CalendarEvent[] = [],
): Promise<ScheduledBlock> => {
  assertValidTimeRange(input.start, input.end)

  const conflicts = checkScheduleConflict(
    input,
    existingBlocks,
    existingCalendarEvents,
  )
  if (conflicts.length > 0) {
    throw new Error('Scheduled block conflicts with an existing event')
  }

  const timestamp = nowIso()
  const block: ScheduledBlock = {
    ...input,
    id: createId('block'),
    source: input.source ?? 'manual',
    syncedToGoogleCalendar: input.syncedToGoogleCalendar ?? false,
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  await repository.addScheduledBlock(block)
  return block
}
