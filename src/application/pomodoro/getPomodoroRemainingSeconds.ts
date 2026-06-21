import { calculateRemainingSeconds } from '../../domain/pomodoro/pomodoroRules'
import type { PomodoroTimer } from '../../types'
import { nowIso } from '../../utils/dateTime'

export const getPomodoroRemainingSeconds = (
  timer: PomodoroTimer | undefined,
  now = nowIso(),
): number => {
  if (!timer || timer.status === 'idle' || timer.status === 'completed') {
    return 0
  }

  if (timer.status === 'paused') {
    return Math.max(0, timer.remainingSecondsWhenPaused ?? 0)
  }

  return calculateRemainingSeconds(now, timer.targetEndAt)
}
