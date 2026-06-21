import { describe, expect, it } from 'vitest'
import type { PomodoroSession } from '../../types'
import { countCompletedFocusSessions } from './countCompletedFocusSessions'

const sessions: PomodoroSession[] = [
  {
    id: 'focus-task-a',
    taskId: 'task-a',
    scheduledBlockId: 'block-a',
    type: 'focus',
    startedAt: '2026-06-21T01:00:00.000Z',
    endedAt: '2026-06-21T01:25:00.000Z',
    completed: true,
  },
  {
    id: 'focus-incomplete',
    taskId: 'task-a',
    type: 'focus',
    startedAt: '2026-06-21T02:00:00.000Z',
    completed: false,
  },
  {
    id: 'short-break',
    type: 'short_break',
    startedAt: '2026-06-21T03:00:00.000Z',
    endedAt: '2026-06-21T03:05:00.000Z',
    completed: true,
  },
  {
    id: 'long-break',
    type: 'long_break',
    startedAt: '2026-06-21T04:00:00.000Z',
    endedAt: '2026-06-21T04:15:00.000Z',
    completed: true,
  },
  {
    id: 'focus-task-b',
    taskId: 'task-b',
    scheduledBlockId: 'block-b',
    type: 'focus',
    startedAt: '2026-06-21T05:00:00.000Z',
    endedAt: '2026-06-21T05:25:00.000Z',
    completed: true,
  },
]

describe('countCompletedFocusSessions', () => {
  it('counts completed focus sessions', () => {
    expect(countCompletedFocusSessions(sessions)).toBe(2)
  })

  it('does not count completed break sessions', () => {
    expect(countCompletedFocusSessions(sessions.slice(2, 4))).toBe(0)
  })

  it('does not count incomplete focus sessions', () => {
    expect(countCompletedFocusSessions([sessions[1]])).toBe(0)
  })

  it('filters completed focus sessions by task id', () => {
    expect(countCompletedFocusSessions(sessions, { taskId: 'task-a' })).toBe(1)
  })

  it('filters completed focus sessions by scheduled block id', () => {
    expect(
      countCompletedFocusSessions(sessions, { scheduledBlockId: 'block-b' }),
    ).toBe(1)
  })
})
