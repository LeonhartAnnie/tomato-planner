import { describe, expect, it, vi } from 'vitest'
import type { PomodoroTimer } from '../../types'
import type { PomodoroRepository } from './pomodoroRepository'
import { completePomodoro } from './completePomodoro'

const runningTimer: PomodoroTimer = {
  id: 'timer-1',
  taskId: 'task-1',
  type: 'focus',
  status: 'running',
  startedAt: '2026-06-21T01:00:00.000Z',
  targetEndAt: '2026-06-21T01:25:00.000Z',
  durationMinutes: 25,
  completed: false,
}

const createRepository = (): PomodoroRepository => ({
  getAllPomodoroSessions: vi.fn().mockResolvedValue([]),
  addPomodoroSession: vi.fn().mockResolvedValue(undefined),
  updatePomodoroSession: vi.fn().mockResolvedValue(undefined),
  deletePomodoroSession: vi.fn().mockResolvedValue(undefined),
})

describe('completePomodoro', () => {
  it('creates a completed session from a running timer', async () => {
    const session = await completePomodoro(
      runningTimer,
      createRepository(),
      '2026-06-21T01:25:00.000Z',
    )
    expect(session).toMatchObject({
      taskId: runningTimer.taskId,
      type: 'focus',
      startedAt: runningTimer.startedAt,
      completed: true,
    })
  })

  it('sets endedAt', async () => {
    const endedAt = '2026-06-21T01:25:00.000Z'
    const session = await completePomodoro(
      runningTimer,
      createRepository(),
      endedAt,
    )
    expect(session.endedAt).toBe(endedAt)
  })

  it('adds the session through the repository', async () => {
    const repository = createRepository()
    const session = await completePomodoro(
      runningTimer,
      repository,
      '2026-06-21T01:25:00.000Z',
    )
    expect(repository.addPomodoroSession).toHaveBeenCalledWith(session)
  })
})
