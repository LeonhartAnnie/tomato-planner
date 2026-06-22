import { describe, expect, it } from 'vitest'
import type { ScheduledBlock } from '../../types'
import { getScheduledBlockFocusAvailability } from './scheduledBlockFocusRules'

const block: ScheduledBlock = {
  id: 'block-1',
  taskId: 'task-1',
  title: '排程',
  start: '2026-06-22T10:00:00.000Z',
  end: '2026-06-22T10:25:00.000Z',
  source: 'manual',
  syncedToGoogleCalendar: false,
  createdAt: '2026-06-21T00:00:00.000Z',
  updatedAt: '2026-06-21T00:00:00.000Z',
}

describe('getScheduledBlockFocusAvailability', () => {
  it('rejects a block that has ended', () => {
    expect(
      getScheduledBlockFocusAvailability(block, '2026-06-22T10:25:00.000Z'),
    ).toEqual({ canStart: false, reason: 'ended' })
  })

  it('rejects a block that has not started', () => {
    expect(
      getScheduledBlockFocusAvailability(block, '2026-06-22T09:59:59.000Z'),
    ).toEqual({ canStart: false, reason: 'not-started' })
  })

  it('allows a block currently in progress', () => {
    expect(
      getScheduledBlockFocusAvailability(block, '2026-06-22T10:12:00.000Z'),
    ).toEqual({ canStart: true })
  })

  it('allows starting exactly at the block start', () => {
    expect(getScheduledBlockFocusAvailability(block, block.start)).toEqual({
      canStart: true,
    })
  })

  it('supports an in-progress cross-day block', () => {
    expect(
      getScheduledBlockFocusAvailability(
        {
          ...block,
          start: '2026-06-22T23:45:00.000Z',
          end: '2026-06-23T00:15:00.000Z',
        },
        '2026-06-23T00:05:00.000Z',
      ),
    ).toEqual({ canStart: true })
  })

  it.each([
    { start: 'invalid', end: block.end },
    { start: block.start, end: 'invalid' },
    { start: block.start, end: block.start },
  ])('rejects an invalid time range', ({ start, end }) => {
    expect(
      getScheduledBlockFocusAvailability(
        { ...block, start, end },
        '2026-06-22T10:12:00.000Z',
      ),
    ).toEqual({ canStart: false, reason: 'invalid-time' })
  })
})
