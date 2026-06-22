import type { PomodoroTimer, ScheduledBlock } from '../../types'
import { getScheduledBlockFocusAvailability } from '../../domain/schedule/scheduledBlockFocusRules'
import { nowIso } from '../../utils/dateTime'
import { startPomodoro } from './startPomodoro'

const unavailableMessages = {
  'not-started': '此排程尚未開始，請等到排程時間內再開始專注。',
  ended: '此排程已結束，無法開始專注。',
  'invalid-time': '此排程時間無效，無法開始專注。',
} as const

export const getScheduledBlockFocusDurationMinutes = (
  block: ScheduledBlock,
  fallbackDurationMinutes: number,
): number => {
  const startTime = new Date(block.start).getTime()
  const endTime = new Date(block.end).getTime()
  const durationMinutes = (endTime - startTime) / 60_000
  return Number.isFinite(durationMinutes) && durationMinutes > 0
    ? durationMinutes
    : fallbackDurationMinutes
}

export const startPomodoroForScheduledBlock = (
  block: ScheduledBlock,
  fallbackDurationMinutes: number,
  startedAt?: string,
): PomodoroTimer => {
  const timerStartedAt = startedAt ?? nowIso()
  const availability = getScheduledBlockFocusAvailability(
    block,
    timerStartedAt,
  )
  if (!availability.canStart) {
    throw new Error(unavailableMessages[availability.reason])
  }
  const durationMinutes = getScheduledBlockFocusDurationMinutes(
    block,
    fallbackDurationMinutes,
  )

  return startPomodoro({
    taskId: block.taskId,
    scheduledBlockId: block.id,
    type: 'focus',
    durationMinutes,
    startedAt: timerStartedAt,
  })
}
