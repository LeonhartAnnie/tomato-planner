import { describe, expect, it } from 'vitest'
import { startPomodoro } from './startPomodoro'

describe('startPomodoro', () => {
  it('creates a running focus timer', () => {
    const timer = startPomodoro({
      type: 'focus',
      durationMinutes: 25,
      startedAt: '2026-06-21T01:00:00.000Z',
    })

    expect(timer).toMatchObject({
      type: 'focus',
      durationMinutes: 25,
      status: 'running',
      completed: false,
    })
  })

  it('generates an id', () => {
    expect(
      startPomodoro({ type: 'focus', durationMinutes: 25 }).id,
    ).not.toBe('')
  })

  it('sets startedAt automatically', () => {
    const timer = startPomodoro({ type: 'focus', durationMinutes: 25 })
    expect(Number.isNaN(Date.parse(timer.startedAt))).toBe(false)
  })

  it('calculates targetEndAt', () => {
    const timer = startPomodoro({
      type: 'focus',
      durationMinutes: 25,
      startedAt: '2026-06-21T01:00:00.000Z',
    })
    expect(timer.targetEndAt).toBe('2026-06-21T01:25:00.000Z')
  })

  it('rejects a non-positive duration', () => {
    expect(() =>
      startPomodoro({ type: 'focus', durationMinutes: 0 }),
    ).toThrow()
  })
})
