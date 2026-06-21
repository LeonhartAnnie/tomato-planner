import { calculateRemainingSeconds } from '../../domain/pomodoro/pomodoroRules'
import type { PomodoroTimer } from '../../types'
import { nowIso } from '../../utils/dateTime'

export const pausePomodoro = (
  timer: PomodoroTimer,
  now = nowIso(),
): PomodoroTimer => {
  if (timer.status !== 'running') {
    throw new Error('Only a running Pomodoro timer can be paused')
  }

  return {
    ...timer,
    status: 'paused',
    pausedAt: now,
    remainingSecondsWhenPaused: calculateRemainingSeconds(
      now,
      timer.targetEndAt,
    ),
  }
}
