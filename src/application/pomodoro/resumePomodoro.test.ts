import { describe, expect, it } from 'vitest'
import type { PomodoroTimer } from '../../types'
import { resumePomodoro } from './resumePomodoro'

const pausedTimer: PomodoroTimer = {
  id: 'timer-1',
  type: 'focus',
  status: 'paused',
  startedAt: '2026-06-21T01:00:00.000Z',
  targetEndAt: '2026-06-21T01:25:00.000Z',
  durationMinutes: 25,
  pausedAt: '2026-06-21T01:10:00.000Z',
  remainingSecondsWhenPaused: 900,
  completed: false,
}

describe('resumePomodoro', () => {
  it('resumes a paused timer', () => {
    const resumed = resumePomodoro(pausedTimer, '2026-06-21T02:00:00.000Z')
    expect(resumed.status).toBe('running')
    expect(resumed.pausedAt).toBeUndefined()
  })

  it('recalculates targetEndAt from remaining seconds', () => {
    const resumed = resumePomodoro(pausedTimer, '2026-06-21T02:00:00.000Z')
    expect(resumed.targetEndAt).toBe('2026-06-21T02:15:00.000Z')
  })

  it('rejects a timer that is not paused', () => {
    expect(() =>
      resumePomodoro(
        { ...pausedTimer, status: 'running' },
        '2026-06-21T02:00:00.000Z',
      ),
    ).toThrow()
  })
})
