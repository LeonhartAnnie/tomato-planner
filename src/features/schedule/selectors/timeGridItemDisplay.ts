export type TimeGridItemDisplayMode = 'compact' | 'normal'
export type TimeGridDisplayItemKind = 'scheduled_block' | 'calendar_event'

const NORMAL_DISPLAY_MINUTES = 60

export const getTimeGridItemDisplayMode = (
  segmentStart: string,
  segmentEnd: string,
): TimeGridItemDisplayMode => {
  const startTime = new Date(segmentStart).getTime()
  const endTime = new Date(segmentEnd).getTime()
  const durationMinutes = (endTime - startTime) / 60_000

  if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
    throw new Error('Time grid item requires a valid positive duration')
  }
  return durationMinutes < NORMAL_DISPLAY_MINUTES ? 'compact' : 'normal'
}

export const shouldShowTimeGridInlineActions = (
  kind: TimeGridDisplayItemKind,
  mode: TimeGridItemDisplayMode,
): boolean => kind === 'scheduled_block' && mode === 'normal'
