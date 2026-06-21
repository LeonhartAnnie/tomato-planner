import { describe, expect, it, vi } from 'vitest'
import type { ScheduleRepository } from './scheduleRepository'
import {
  createScheduledBlock,
  type CreateScheduledBlockInput,
} from './createScheduledBlock'

const createRepository = (): ScheduleRepository => ({
  getAllScheduledBlocks: vi.fn().mockResolvedValue([]),
  addScheduledBlock: vi.fn().mockResolvedValue(undefined),
  updateScheduledBlock: vi.fn().mockResolvedValue(undefined),
  deleteScheduledBlock: vi.fn().mockResolvedValue(undefined),
  getAllCalendarEvents: vi.fn().mockResolvedValue([]),
  setCalendarEvents: vi.fn().mockResolvedValue(undefined),
})

const validInput: CreateScheduledBlockInput = {
  taskId: 'task-1',
  title: '專注工作',
  start: '2026-06-20T09:00:00.000Z',
  end: '2026-06-20T10:00:00.000Z',
}

describe('createScheduledBlock', () => {
  it('creates a scheduled block from valid input', async () => {
    const block = await createScheduledBlock(validInput, createRepository())
    expect(block).toMatchObject(validInput)
    expect(block.id).not.toBe('')
    expect(block.createdAt).toBe(block.updatedAt)
  })

  it('rejects equal start and end times', async () => {
    await expect(
      createScheduledBlock(
        { ...validInput, end: validInput.start },
        createRepository(),
      ),
    ).rejects.toThrow()
  })

  it('rejects an end time before the start time', async () => {
    await expect(
      createScheduledBlock(
        { ...validInput, end: '2026-06-20T08:00:00.000Z' },
        createRepository(),
      ),
    ).rejects.toThrow()
  })

  it('defaults source to manual', async () => {
    const block = await createScheduledBlock(validInput, createRepository())
    expect(block.source).toBe('manual')
  })

  it('defaults Google Calendar sync state to false', async () => {
    const block = await createScheduledBlock(validInput, createRepository())
    expect(block.syncedToGoogleCalendar).toBe(false)
  })

  it('adds the block through the repository', async () => {
    const repository = createRepository()
    const block = await createScheduledBlock(validInput, repository)
    expect(repository.addScheduledBlock).toHaveBeenCalledWith(block)
  })
})
