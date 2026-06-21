import type { PomodoroSession } from '../../types'
import { countCompletedFocusSessions } from './countCompletedFocusSessions'
import { getNextPomodoroType } from './getNextPomodoroType'

export interface PomodoroNextStep {
  nextType: PomodoroSession['type']
  reason: 'after_focus' | 'after_break'
}

export const getPomodoroNextStep = (
  lastCompletedSession: PomodoroSession | undefined,
  sessions: PomodoroSession[],
  longBreakInterval: number,
): PomodoroNextStep | undefined => {
  if (!lastCompletedSession) {
    return undefined
  }

  const completedFocusCount = countCompletedFocusSessions(sessions)

  return {
    nextType: getNextPomodoroType(
      lastCompletedSession.type,
      completedFocusCount,
      longBreakInterval,
    ),
    reason:
      lastCompletedSession.type === 'focus' ? 'after_focus' : 'after_break',
  }
}
