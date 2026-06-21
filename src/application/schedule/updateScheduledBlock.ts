import { assertValidTimeRange } from '../../domain/schedule/scheduleRules'
import type { CalendarEvent, ScheduledBlock } from '../../types'
import { nowIso } from '../../utils/dateTime'
import { checkScheduleConflict } from './checkScheduleConflict'
import type { ScheduleRepository } from './scheduleRepository'

const CONFLICT_ERROR = 'Scheduled block conflicts with an existing event'

export const updateScheduledBlock = async (
  block: ScheduledBlock,
  repository: ScheduleRepository,
  existingBlocks: ScheduledBlock[] = [],
  calendarEvents: CalendarEvent[] = [],
): Promise<ScheduledBlock> => {
  assertValidTimeRange(block.start, block.end)

  const otherBlocks = existingBlocks.filter(
    (existingBlock) => existingBlock.id !== block.id,
  )
  const conflicts = checkScheduleConflict(
    block,
    otherBlocks,
    calendarEvents,
  )
  if (conflicts.length > 0) {
    throw new Error(CONFLICT_ERROR)
  }

  const updatedBlock: ScheduledBlock = {
    ...block,
    updatedAt: nowIso(),
  }

  await repository.updateScheduledBlock(updatedBlock)
  return updatedBlock
}
