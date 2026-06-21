import type { PomodoroTimer, ScheduledBlock } from '../../types'
import { startPomodoro } from './startPomodoro'

export const startPomodoroForScheduledBlock = (
  block: ScheduledBlock,
  durationMinutes: number,
  startedAt?: string,
): PomodoroTimer =>
  startPomodoro({
    taskId: block.taskId,
    scheduledBlockId: block.id,
    type: 'focus',
    durationMinutes,
    startedAt,
  })
