import type { PomodoroSession } from '../../types'

export interface CompletedFocusSessionFilter {
  taskId?: string
  scheduledBlockId?: string
}

export const countCompletedFocusSessions = (
  sessions: PomodoroSession[],
  filter: CompletedFocusSessionFilter = {},
): number =>
  sessions.filter(
    (session) =>
      session.completed &&
      session.type === 'focus' &&
      (filter.taskId === undefined || session.taskId === filter.taskId) &&
      (filter.scheduledBlockId === undefined ||
        session.scheduledBlockId === filter.scheduledBlockId),
  ).length
