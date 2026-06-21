import { describe, expect, it } from 'vitest'
import {
  calculateRemainingSeconds,
  calculateTargetEndAt,
  shouldUseLongBreak,
  validatePomodoroDuration,
} from './pomodoroRules'

describe('validatePomodoroDuration', () => {
  it.each([0, -1])('rejects non-positive duration: %s', (minutes) => {
    expect(() => validatePomodoroDuration(minutes)).toThrow()
  })

  it.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
    'rejects non-finite duration: %s',
    (minutes) => {
      expect(() => validatePomodoroDuration(minutes)).toThrow()
    },
  )

  it('accepts a positive finite duration', () => {
    expect(() => validatePomodoroDuration(25)).not.toThrow()
  })
})

describe('calculateTargetEndAt', () => {
  it('adds the duration in minutes and returns an ISO string', () => {
    expect(calculateTargetEndAt('2026-06-21T01:00:00.000Z', 25)).toBe(
      '2026-06-21T01:25:00.000Z',
    )
  })
})

describe('calculateRemainingSeconds', () => {
  it('returns the remaining seconds', () => {
    expect(
      calculateRemainingSeconds(
        '2026-06-21T01:00:00.000Z',
        '2026-06-21T01:01:30.000Z',
      ),
    ).toBe(90)
  })

  it('returns zero when the target has expired', () => {
    expect(
      calculateRemainingSeconds(
        '2026-06-21T01:02:00.000Z',
        '2026-06-21T01:01:30.000Z',
      ),
    ).toBe(0)
  })
})

describe('shouldUseLongBreak', () => {
  it('returns true at the long-break interval', () => {
    expect(shouldUseLongBreak(4, 4)).toBe(true)
  })

  it('returns false before the long-break interval', () => {
    expect(shouldUseLongBreak(3, 4)).toBe(false)
  })

  it('returns false when no focus session is completed', () => {
    expect(shouldUseLongBreak(0, 4)).toBe(false)
  })

  it.each([0, -1])('rejects a non-positive interval: %s', (interval) => {
    expect(() => shouldUseLongBreak(4, interval)).toThrow()
  })
})
