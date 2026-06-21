import { describe, expect, it } from 'vitest'
import type { PomodoroTimer } from '../../types'
import { pausePomodoro } from './pausePomodoro'

const runningTimer: PomodoroTimer = {
  id: 'timer-1',
  type: 'focus',
  status: 'running',
  startedAt: '2026-06-21T01:00:00.000Z',
  targetEndAt: '2026-06-21T01:25:00.000Z',
  durationMinutes: 25,
  completed: false,
}

describe('pausePomodoro', () => {
  it('pauses a running timer', () => {
    const paused = pausePomodoro(runningTimer, '2026-06-21T01:10:00.000Z')
    expect(paused.status).toBe('paused')
  })

  it('records pausedAt', () => {
    const now = '2026-06-21T01:10:00.000Z'
    expect(pausePomodoro(runningTimer, now).pausedAt).toBe(now)
  })

  it('records remaining seconds', () => {
    const paused = pausePomodoro(runningTimer, '2026-06-21T01:10:00.000Z')
    expect(paused.remainingSecondsWhenPaused).toBe(900)
  })

  it('rejects a timer that is not running', () => {
    expect(() =>
      pausePomodoro(
        { ...runningTimer, status: 'paused' },
        '2026-06-21T01:10:00.000Z',
      ),
    ).toThrow()
  })
})
