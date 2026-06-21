import { describe, expect, it } from 'vitest'
import type { ScheduledBlock } from '../../types'
import { startPomodoroForScheduledBlock } from './startPomodoroForScheduledBlock'

const block: ScheduledBlock = {
  id: 'block-1',
  taskId: 'task-1',
  title: '專注排程',
  start: '2026-06-21T01:00:00.000Z',
  end: '2026-06-21T02:00:00.000Z',
  source: 'manual',
  syncedToGoogleCalendar: false,
  createdAt: '2026-06-20T00:00:00.000Z',
  updatedAt: '2026-06-20T00:00:00.000Z',
}

describe('startPomodoroForScheduledBlock', () => {
  it('creates a focus timer for a scheduled block', () => {
    const timer = startPomodoroForScheduledBlock(
      block,
      25,
      '2026-06-21T01:00:00.000Z',
    )

    expect(timer).toMatchObject({
      taskId: block.taskId,
      scheduledBlockId: block.id,
      type: 'focus',
      durationMinutes: 25,
      status: 'running',
    })
  })

  it('uses the task and scheduled block ids', () => {
    const timer = startPomodoroForScheduledBlock(
      block,
      25,
      '2026-06-21T01:00:00.000Z',
    )

    expect(timer.taskId).toBe('task-1')
    expect(timer.scheduledBlockId).toBe('block-1')
  })

  it('always creates a focus timer', () => {
    expect(
      startPomodoroForScheduledBlock(
        block,
        25,
        '2026-06-21T01:00:00.000Z',
      ).type,
    ).toBe('focus')
  })

  it('rejects a non-positive duration', () => {
    expect(() => startPomodoroForScheduledBlock(block, 0)).toThrow()
  })

  it('calculates targetEndAt', () => {
    expect(
      startPomodoroForScheduledBlock(
        block,
        25,
        '2026-06-21T01:00:00.000Z',
      ).targetEndAt,
    ).toBe('2026-06-21T01:25:00.000Z')
  })
})
