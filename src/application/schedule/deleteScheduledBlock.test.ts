import { describe, expect, it, vi } from 'vitest'
import type { ScheduleRepository } from './scheduleRepository'
import { deleteScheduledBlock } from './deleteScheduledBlock'

const repository: ScheduleRepository = {
  getAllScheduledBlocks: vi.fn().mockResolvedValue([]),
  addScheduledBlock: vi.fn().mockResolvedValue(undefined),
  updateScheduledBlock: vi.fn().mockResolvedValue(undefined),
  deleteScheduledBlock: vi.fn().mockResolvedValue(undefined),
  getAllCalendarEvents: vi.fn().mockResolvedValue([]),
  setCalendarEvents: vi.fn().mockResolvedValue(undefined),
}

describe('deleteScheduledBlock', () => {
  it('deletes the block through the repository', async () => {
    await deleteScheduledBlock('block-1', repository)
    expect(repository.deleteScheduledBlock).toHaveBeenCalledWith('block-1')
  })
})
