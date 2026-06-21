import { describe, expect, it } from 'vitest'
import type { Task } from '../../../types'
import {
  createDroppedTaskTimeRange,
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
})
