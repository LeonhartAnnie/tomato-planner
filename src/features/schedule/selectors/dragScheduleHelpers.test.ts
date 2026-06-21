import { describe, expect, it } from 'vitest'
import type { ScheduledBlock, Task } from '../../../types'
import {
  createDroppedTaskTimeRange,
  createRescheduledBlockTimeRange,
  getScheduledBlockDurationMinutes,
  getTaskScheduleDurationMinutes,
  toScheduleStartIso,
} from './dragScheduleHelpers'

const task: Task = {
  id: 'task-1',
  title: 'Write report',
  estimatedMinutes: 45,
  splittable: false,
  createdAt: '2026-06-20T08:00:00.000Z',
  updatedAt: '2026-06-20T08:00:00.000Z',
}

const block: ScheduledBlock = {
  id: 'block-1',
  taskId: task.id,
  title: task.title,
  start: '2026-06-21T09:30:00.000Z',
  end: '2026-06-21T10:15:00.000Z',
  source: 'manual',
  syncedToGoogleCalendar: false,
  createdAt: '2026-06-20T08:00:00.000Z',
  updatedAt: '2026-06-20T08:00:00.000Z',
}

describe('dragScheduleHelpers', () => {
  it('converts a date key and HH:mm into a local start ISO string', () => {
    expect(toScheduleStartIso('2026-06-21', '09:30')).toBe(
      new Date('2026-06-21T09:30').toISOString(),
    )
  })

  it('calculates end ISO from the selected start and duration', () => {
    const range = createDroppedTaskTimeRange(
      '2026-06-21',
      '09:30',
      task,
      25,
    )

    expect(range.start).toBe(new Date('2026-06-21T09:30').toISOString())
    expect(range.end).toBe(new Date('2026-06-21T10:15').toISOString())
  })

  it('uses task estimatedMinutes when it is valid', () => {
    expect(getTaskScheduleDurationMinutes(task, 25)).toBe(45)
  })

  it('falls back to the default duration when task estimation is invalid', () => {
    expect(
      getTaskScheduleDurationMinutes(
        { ...task, estimatedMinutes: Number.NaN },
        25,
      ),
    ).toBe(25)
  })

  it('rejects an invalid time string', () => {
    expect(() => toScheduleStartIso('2026-06-21', '25:00')).toThrow(
      'Invalid schedule time: 25:00',
    )
  })

  it('calculates the original scheduled block duration in minutes', () => {
    expect(getScheduledBlockDurationMinutes(block)).toBe(45)
  })

  it('rejects a non-positive scheduled block duration', () => {
    expect(() =>
      getScheduledBlockDurationMinutes({ ...block, end: block.start }),
    ).toThrow('Invalid scheduled block duration')
  })

  it('creates a new range while preserving the block duration', () => {
    const range = createRescheduledBlockTimeRange(
      block,
      '2026-06-23',
      '13:00',
    )

    expect(range).toEqual({
      start: new Date('2026-06-23T13:00').toISOString(),
      end: new Date('2026-06-23T13:45').toISOString(),
      durationMinutes: 45,
    })
  })

  it('rejects an invalid reschedule time with the fixed time error', () => {
    expect(() =>
      createRescheduledBlockTimeRange(block, '2026-06-23', '9:00'),
    ).toThrow('Invalid schedule time: 9:00')
  })

  it('preserves a cross-day block duration', () => {
    const crossDayBlock = {
      ...block,
      start: '2026-06-21T23:30:00.000Z',
      end: '2026-06-22T01:00:00.000Z',
    }

    const range = createRescheduledBlockTimeRange(
      crossDayBlock,
      '2026-06-23',
      '22:00',
    )

    expect(range.durationMinutes).toBe(90)
    expect(range.end).toBe(new Date('2026-06-23T23:30').toISOString())
  })
})
