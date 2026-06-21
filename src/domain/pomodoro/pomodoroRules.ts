const toTimestamp = (isoString: string): number => {
  const timestamp = new Date(isoString).getTime()

  if (!Number.isFinite(timestamp)) {
    throw new Error(`Invalid date-time: ${isoString}`)
  }

  return timestamp
}

export const validatePomodoroDuration = (minutes: number): void => {
  if (!Number.isFinite(minutes) || minutes <= 0) {
    throw new Error('Pomodoro duration must be a positive finite number')
  }
}

export const calculateTargetEndAt = (
  startedAt: string,
  durationMinutes: number,
): string => {
  validatePomodoroDuration(durationMinutes)
  return new Date(
    toTimestamp(startedAt) + durationMinutes * 60 * 1000,
  ).toISOString()
}

export const calculateRemainingSeconds = (
  now: string,
  targetEndAt: string,
): number =>
  Math.max(0, Math.ceil((toTimestamp(targetEndAt) - toTimestamp(now)) / 1000))

export const shouldUseLongBreak = (
  completedFocusCount: number,
  longBreakInterval: number,
): boolean => {
  if (!Number.isFinite(longBreakInterval) || longBreakInterval <= 0) {
    throw new Error('Long break interval must be a positive finite number')
  }

  return (
    completedFocusCount > 0 &&
    completedFocusCount % longBreakInterval === 0
  )
}
