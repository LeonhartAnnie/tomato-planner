import { describe, expect, it } from 'vitest'
import { getNextPomodoroType } from './getNextPomodoroType'

describe('getNextPomodoroType', () => {
  it('returns short break after focus before the long-break interval', () => {
    expect(getNextPomodoroType('focus', 3, 4)).toBe('short_break')
  })

  it('returns long break after focus at the long-break interval', () => {
    expect(getNextPomodoroType('focus', 4, 4)).toBe('long_break')
  })

  it('returns focus after a short break', () => {
    expect(getNextPomodoroType('short_break', 4, 4)).toBe('focus')
  })

  it('returns focus after a long break', () => {
    expect(getNextPomodoroType('long_break', 4, 4)).toBe('focus')
  })
})
