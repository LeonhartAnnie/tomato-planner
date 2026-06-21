import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ScheduledBlock } from '../../types'
import type { ScheduleRepository } from './scheduleRepository'
import { updateScheduledBlock } from './updateScheduledBlock'

const repository: ScheduleRepository = {
  getAllScheduledBlocks: vi.fn().mockResolvedValue([]),
  addScheduledBlock: vi.fn().mockResolvedValue(undefined),
  updateScheduledBlock: vi.fn().mockResolvedValue(undefined),
  deleteScheduledBlock: vi.fn().mockResolvedValue(undefined),
  getAllCalendarEvents: vi.fn().mockResolvedValue([]),
  setCalendarEvents: vi.fn().mockResolvedValue(undefined),
}

const block: ScheduledBlock = {
  id: 'block-1',
  taskId: 'task-1',
  title: '專注工作',
  start: '2026-06-21T01:00:00.000Z',
  end: '2026-06-21T02:00:00.000Z',
  source: 'manual',
  syncedToGoogleCalendar: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

afterEach(() => {
  vi.useRealTimers()
  vi.clearAllMocks()
})

describe('updateScheduledBlock', () => {
  it('validates the time range', async () => {
    await expect(
      updateScheduledBlock({ ...block, end: block.start }, repository),
    ).rejects.toThrow()
    expect(repository.updateScheduledBlock).not.toHaveBeenCalled()
  })

  it('preserves createdAt and updates updatedAt', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-21T03:00:00.000Z'))

    const updated = await updateScheduledBlock(block, repository)

    expect(updated.createdAt).toBe(block.createdAt)
    expect(updated.updatedAt).toBe('2026-06-21T03:00:00.000Z')
  })

  it('persists and returns the updated block', async () => {
    const updated = await updateScheduledBlock(block, repository)

    expect(repository.updateScheduledBlock).toHaveBeenCalledWith(updated)
    expect(updated.id).toBe(block.id)
  })
})
