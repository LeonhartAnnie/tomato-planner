import { calculateTargetEndAt } from '../../domain/pomodoro/pomodoroRules'
import type { PomodoroTimer } from '../../types'
import { nowIso } from '../../utils/dateTime'

export const resumePomodoro = (
  timer: PomodoroTimer,
  now = nowIso(),
): PomodoroTimer => {
  if (timer.status !== 'paused') {
    throw new Error('Only a paused Pomodoro timer can be resumed')
  }

  const remainingSeconds = timer.remainingSecondsWhenPaused
  if (remainingSeconds === undefined || remainingSeconds <= 0) {
    throw new Error('Paused Pomodoro timer has no remaining time')
  }

  return {
    ...timer,
    status: 'running',
    targetEndAt: calculateTargetEndAt(now, remainingSeconds / 60),
    pausedAt: undefined,
    remainingSecondsWhenPaused: undefined,
  }
}
