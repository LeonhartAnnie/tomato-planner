const toTimestamp = (isoString: string): number => {
  const timestamp = new Date(isoString).getTime()

  if (!Number.isFinite(timestamp)) {
    throw new Error(`Invalid date-time: ${isoString}`)
  }

  return timestamp
}

export const isOverlapping = (
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string,
): boolean =>
  toTimestamp(aStart) < toTimestamp(bEnd) &&
  toTimestamp(aEnd) > toTimestamp(bStart)

export const assertValidTimeRange = (start: string, end: string): void => {
  if (toTimestamp(end) <= toTimestamp(start)) {
    throw new Error('End time must be after start time')
  }
}
