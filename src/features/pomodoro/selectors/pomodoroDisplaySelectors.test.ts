import { describe, expect, it } from 'vitest'
import type {
  PomodoroSession,
  PomodoroTimer,
  ScheduledBlock,
  Task,
} from '../../../types'
import {
  findScheduledBlockForSession,
  findScheduledBlockForTimer,
  findTaskForSession,
  findTaskForTimer,
} from './pomodoroDisplaySelectors'

const task: Task = {
  id: 'task-1',
  title: '撰寫報告',
  estimatedMinutes: 50,
  splittable: false,
  createdAt: '2026-06-20T00:00:00.000Z',
  updatedAt: '2026-06-20T00:00:00.000Z',
}

const block: ScheduledBlock = {
  id: 'block-1',
  taskId: task.id,
  title: task.title,
  start: '2026-06-21T01:00:00.000Z',
  end: '2026-06-21T02:00:00.000Z',
  source: 'manual',
  syncedToGoogleCalendar: false,
  createdAt: '2026-06-20T00:00:00.000Z',
  updatedAt: '2026-06-20T00:00:00.000Z',
}

const timer: PomodoroTimer = {
  id: 'timer-1',
  taskId: task.id,
  scheduledBlockId: block.id,
  type: 'focus',
  status: 'running',
  startedAt: '2026-06-21T01:00:00.000Z',
  targetEndAt: '2026-06-21T01:25:00.000Z',
  durationMinutes: 25,
  completed: false,
}

const session: PomodoroSession = {
  id: 'session-1',
  taskId: task.id,
  scheduledBlockId: block.id,
  type: 'focus',
  startedAt: timer.startedAt,
  endedAt: timer.targetEndAt,
  completed: true,
}

describe('pomodoroDisplaySelectors', () => {
  it('finds a task for a timer', () => {
    expect(findTaskForTimer(timer, [task])).toBe(task)
  })

  it('finds a scheduled block for a timer', () => {
    expect(findScheduledBlockForTimer(timer, [block])).toBe(block)
  })

  it('returns undefined when a timer task cannot be found', () => {
    expect(findTaskForTimer(timer, [])).toBeUndefined()
  })

  it('finds a task for a session', () => {
    expect(findTaskForSession(session, [task])).toBe(task)
  })

  it('finds a scheduled block for a session', () => {
    expect(findScheduledBlockForSession(session, [block])).toBe(block)
  })
})
