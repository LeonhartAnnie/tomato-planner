import type { ScheduledBlock } from '../../types'

export type ScheduledBlockFocusUnavailableReason =
  | 'not-started'
  | 'ended'
  | 'invalid-time'

export type ScheduledBlockFocusAvailability =
  | { canStart: true }
  | { canStart: false; reason: ScheduledBlockFocusUnavailableReason }

export const getScheduledBlockFocusAvailability = (
  block: ScheduledBlock,
  now: string,
): ScheduledBlockFocusAvailability => {
  const startTime = new Date(block.start).getTime()
  const endTime = new Date(block.end).getTime()
  const nowTime = new Date(now).getTime()

  if (
    !Number.isFinite(startTime) ||
    !Number.isFinite(endTime) ||
    !Number.isFinite(nowTime) ||
    endTime <= startTime
  ) {
    return { canStart: false, reason: 'invalid-time' }
  }
  if (nowTime < startTime) {
    return { canStart: false, reason: 'not-started' }
  }
  if (nowTime >= endTime) {
    return { canStart: false, reason: 'ended' }
  }
  return { canStart: true }
}
