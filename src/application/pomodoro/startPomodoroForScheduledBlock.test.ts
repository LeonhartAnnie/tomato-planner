import { describe, expect, it } from 'vitest'
import type { ScheduledBlock } from '../../types'
import {
  getScheduledBlockFocusDurationMinutes,
  startPomodoroForScheduledBlock,
} from './startPomodoroForScheduledBlock'

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
      durationMinutes: 60,
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

  it('uses the scheduled block duration instead of the fallback duration', () => {
    const twentyFiveMinuteBlock = {
      ...block,
      end: '2026-06-21T01:25:00.000Z',
    }

    const timer = startPomodoroForScheduledBlock(
      twentyFiveMinuteBlock,
      30,
      '2026-06-21T01:00:00.000Z',
    )

    expect(timer.durationMinutes).toBe(25)
    expect(timer.targetEndAt).toBe('2026-06-21T01:25:00.000Z')
  })

  it('calculates the fallback duration for an invalid block duration', () => {
    expect(
      getScheduledBlockFocusDurationMinutes(
        { ...block, end: block.start },
        30,
      ),
    ).toBe(30)
  })

  it('calculates targetEndAt', () => {
    expect(
      startPomodoroForScheduledBlock(
        block,
        25,
        '2026-06-21T01:00:00.000Z',
      ).targetEndAt,
    ).toBe('2026-06-21T02:00:00.000Z')
  })

  it('rejects a block that has not started', () => {
    expect(() =>
      startPomodoroForScheduledBlock(
        block,
        30,
        '2026-06-21T00:59:59.000Z',
      ),
    ).toThrow('此排程尚未開始')
  })

  it('rejects a block that has ended', () => {
    expect(() =>
      startPomodoroForScheduledBlock(
        block,
        30,
        '2026-06-21T02:00:00.000Z',
      ),
    ).toThrow('此排程已結束')
  })

  it('rejects an invalid block time', () => {
    expect(() =>
      startPomodoroForScheduledBlock(
        { ...block, end: block.start },
        30,
        block.start,
      ),
    ).toThrow('此排程時間無效')
  })
})
