import type { PomodoroSession, PomodoroTimer } from '../../types'
import { nowIso } from '../../utils/dateTime'
import { createId } from '../../utils/id'
import type { PomodoroRepository } from './pomodoroRepository'

export const completePomodoro = async (
  timer: PomodoroTimer,
  repository: PomodoroRepository,
  now = nowIso(),
): Promise<PomodoroSession> => {
  const session: PomodoroSession = {
    id: createId('session'),
    taskId: timer.taskId,
    scheduledBlockId: timer.scheduledBlockId,
    type: timer.type,
    startedAt: timer.startedAt,
    endedAt: now,
    completed: true,
  }

  await repository.addPomodoroSession(session)
  return session
}
