import { shouldUseLongBreak } from '../../domain/pomodoro/pomodoroRules'
import type { PomodoroSession } from '../../types'

export const getNextPomodoroType = (
  completedType: PomodoroSession['type'],
  completedFocusCount: number,
  longBreakInterval: number,
): PomodoroSession['type'] => {
  if (completedType !== 'focus') {
    return 'focus'
  }

  return shouldUseLongBreak(completedFocusCount, longBreakInterval)
    ? 'long_break'
    : 'short_break'
}
