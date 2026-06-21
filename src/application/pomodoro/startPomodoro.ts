import {
  calculateTargetEndAt,
  validatePomodoroDuration,
} from '../../domain/pomodoro/pomodoroRules'
import type { PomodoroTimer } from '../../types'
import { nowIso } from '../../utils/dateTime'
import { createId } from '../../utils/id'

export interface StartPomodoroInput {
  taskId?: string
  scheduledBlockId?: string
  type: PomodoroTimer['type']
  durationMinutes: number
  startedAt?: string
}

export const startPomodoro = (input: StartPomodoroInput): PomodoroTimer => {
  validatePomodoroDuration(input.durationMinutes)
  const startedAt = input.startedAt ?? nowIso()

  return {
    id: createId('timer'),
    taskId: input.taskId,
    scheduledBlockId: input.scheduledBlockId,
    type: input.type,
    status: 'running',
    startedAt,
    targetEndAt: calculateTargetEndAt(startedAt, input.durationMinutes),
    durationMinutes: input.durationMinutes,
    completed: false,
  }
}
