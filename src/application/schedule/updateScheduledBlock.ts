import { assertValidTimeRange } from '../../domain/schedule/scheduleRules'
import type { ScheduledBlock } from '../../types'
import { nowIso } from '../../utils/dateTime'
import type { ScheduleRepository } from './scheduleRepository'

export const updateScheduledBlock = async (
  block: ScheduledBlock,
  repository: ScheduleRepository,
): Promise<ScheduledBlock> => {
  assertValidTimeRange(block.start, block.end)

  const updatedBlock: ScheduledBlock = {
    ...block,
    updatedAt: nowIso(),
  }

  await repository.updateScheduledBlock(updatedBlock)
  return updatedBlock
}
