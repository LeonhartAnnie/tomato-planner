import { describe, expect, it } from 'vitest'
import type { PomodoroSession } from '../../types'
import { getPomodoroNextStep } from './getPomodoroNextStep'

const completedSession = (
  id: string,
  type: PomodoroSession['type'],
): PomodoroSession => ({
  id,
  type,
  startedAt: '2026-06-21T01:00:00.000Z',
  endedAt: '2026-06-21T01:25:00.000Z',
  completed: true,
})

describe('getPomodoroNextStep', () => {
  it('suggests a short break after focus before the long-break interval', () => {
    const focusSessions = [1, 2, 3].map((index) =>
      completedSession(`focus-${index}`, 'focus'),
    )

    expect(getPomodoroNextStep(focusSessions[2], focusSessions, 4)).toEqual({
      nextType: 'short_break',
      reason: 'after_focus',
    })
  })

  it('suggests a long break when the focus count reaches the interval', () => {
    const focusSessions = [1, 2, 3, 4].map((index) =>
      completedSession(`focus-${index}`, 'focus'),
    )

    expect(getPomodoroNextStep(focusSessions[3], focusSessions, 4)).toEqual({
      nextType: 'long_break',
      reason: 'after_focus',
    })
  })

  it('suggests focus after a short break', () => {
    const shortBreak = completedSession('short-break', 'short_break')

    expect(getPomodoroNextStep(shortBreak, [shortBreak], 4)).toEqual({
      nextType: 'focus',
      reason: 'after_break',
    })
  })

  it('suggests focus after a long break', () => {
    const longBreak = completedSession('long-break', 'long_break')

    expect(getPomodoroNextStep(longBreak, [longBreak], 4)).toEqual({
      nextType: 'focus',
      reason: 'after_break',
    })
  })

  it('returns undefined without a completed session', () => {
    expect(getPomodoroNextStep(undefined, [], 4)).toBeUndefined()
  })
})
