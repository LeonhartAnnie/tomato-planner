import { formatTime } from '../../../utils/dateTime'

export interface TimeGridTick {
  hour: number
  label: string
  offsetPercent: number
}

export interface TimeGridPosition {
  topPercent: number
  heightPercent: number
  hidden: boolean
}

export interface TimeGridDailySegment {
  dateKey: string
  segmentStart: string
  segmentEnd: string
  continuesFromPreviousDay: boolean
  continuesIntoNextDay: boolean
}

export interface TimeGridDropInput {
  pointerY: number
  gridTop: number
  gridHeight: number
  startHour: number
  endHour: number
  snapMinutes?: number
}

export interface TimeGridDropTime {
  hour: number
  minute: number
  timeString: string
}

const assertValidCalendarRange = (
  startHour: number,
  endHour: number,
): void => {
  const isValid =
    Number.isFinite(startHour) &&
    Number.isFinite(endHour) &&
    Number.isInteger(startHour) &&
    Number.isInteger(endHour) &&
    startHour >= 0 &&
    endHour <= 24 &&
    endHour > startHour

  if (!isValid) {
    throw new Error('Invalid calendar view range')
  }
}

const formatHour = (hour: number): string =>
  `${hour.toString().padStart(2, '0')}:00`

const clampPercent = (value: number): number =>
  Math.min(100, Math.max(0, value))

const toLocalDateKey = (date: Date): string => {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

const parseDateKeyStart = (dateKey: string): Date => {
  const date = new Date(`${dateKey}T00:00:00`)
  if (!Number.isFinite(date.getTime()) || toLocalDateKey(date) !== dateKey) {
    throw new Error('Invalid schedule date range')
  }
  return date
}

export const createHourlyTicks = (
  startHour: number,
  endHour: number,
): TimeGridTick[] => {
  assertValidCalendarRange(startHour, endHour)
  const durationHours = endHour - startHour

  return Array.from({ length: durationHours + 1 }, (_, index) => {
    const hour = startHour + index
    return {
      hour,
      label: formatHour(hour),
      offsetPercent: (index / durationHours) * 100,
    }
  })
}

export const calculateTimeGridPosition = (
  startIso: string,
  endIso: string,
  calendarStartHour: number,
  calendarEndHour: number,
): TimeGridPosition => {
  assertValidCalendarRange(calendarStartHour, calendarEndHour)

  const eventStart = new Date(startIso)
  const eventEnd = new Date(endIso)
  const eventStartTime = eventStart.getTime()
  const eventEndTime = eventEnd.getTime()

  if (!Number.isFinite(eventStartTime) || !Number.isFinite(eventEndTime)) {
    throw new Error('Invalid schedule event date')
  }
  if (eventEndTime <= eventStartTime) {
    throw new Error('Invalid schedule event range')
  }

  const gridStart = new Date(eventStart)
  gridStart.setHours(calendarStartHour, 0, 0, 0)
  const gridEnd = new Date(eventStart)
  gridEnd.setHours(calendarEndHour, 0, 0, 0)

  const gridStartTime = gridStart.getTime()
  const gridEndTime = gridEnd.getTime()
  const gridDuration = gridEndTime - gridStartTime
  const visibleStart = Math.max(eventStartTime, gridStartTime)
  const visibleEnd = Math.min(eventEndTime, gridEndTime)
  const topPercent = clampPercent(
    ((visibleStart - gridStartTime) / gridDuration) * 100,
  )

  if (visibleEnd <= visibleStart) {
    return { topPercent, heightPercent: 0, hidden: true }
  }

  return {
    topPercent,
    heightPercent: ((visibleEnd - visibleStart) / gridDuration) * 100,
    hidden: false,
  }
}

export const splitEventIntoDailySegments = (
  startIso: string,
  endIso: string,
  dateKeys: string[],
): TimeGridDailySegment[] => {
  const eventStart = new Date(startIso)
  const eventEnd = new Date(endIso)
  const eventStartTime = eventStart.getTime()
  const eventEndTime = eventEnd.getTime()

  if (!Number.isFinite(eventStartTime) || !Number.isFinite(eventEndTime)) {
    throw new Error('Invalid schedule event date')
  }
  if (eventEndTime <= eventStartTime) {
    throw new Error('Invalid schedule event range')
  }

  return dateKeys.flatMap((dateKey) => {
    const dayStart = parseDateKeyStart(dateKey)
    const dayEnd = new Date(dayStart)
    dayEnd.setDate(dayEnd.getDate() + 1)
    const dayStartTime = dayStart.getTime()
    const dayEndTime = dayEnd.getTime()
    const segmentStartTime = Math.max(eventStartTime, dayStartTime)
    const segmentEndTime = Math.min(eventEndTime, dayEndTime)

    if (segmentEndTime <= segmentStartTime) {
      return []
    }

    return [
      {
        dateKey,
        segmentStart: new Date(segmentStartTime).toISOString(),
        segmentEnd: new Date(segmentEndTime).toISOString(),
        continuesFromPreviousDay: eventStartTime < dayStartTime,
        continuesIntoNextDay: eventEndTime > dayEndTime,
      },
    ]
  })
}

export const formatDailySegmentTimeRange = (
  segment: TimeGridDailySegment,
): string => {
  const segmentEnd = new Date(segment.segmentEnd)
  const endsAtNextMidnight =
    segmentEnd.getHours() === 0 &&
    segmentEnd.getMinutes() === 0 &&
    toLocalDateKey(segmentEnd) !== segment.dateKey
  const endLabel = endsAtNextMidnight
    ? '24:00'
    : formatTime(segment.segmentEnd)

  return `${formatTime(segment.segmentStart)}–${endLabel}`
}

export const calculateTimeFromGridDrop = ({
  pointerY,
  gridTop,
  gridHeight,
  startHour,
  endHour,
  snapMinutes = 15,
}: TimeGridDropInput): TimeGridDropTime => {
  assertValidCalendarRange(startHour, endHour)

  if (!Number.isFinite(gridHeight) || gridHeight <= 0) {
    throw new Error('Invalid time grid height')
  }
  if (!Number.isFinite(pointerY) || !Number.isFinite(gridTop)) {
    throw new Error('Invalid time grid coordinates')
  }

  const rangeMinutes = (endHour - startHour) * 60
  if (
    !Number.isFinite(snapMinutes) ||
    !Number.isInteger(snapMinutes) ||
    snapMinutes <= 0 ||
    snapMinutes > rangeMinutes
  ) {
    throw new Error('Invalid time grid snap minutes')
  }

  const relativePosition = Math.min(
    1,
    Math.max(0, (pointerY - gridTop) / gridHeight),
  )
  const startMinutes = startHour * 60
  const endMinutes = endHour * 60
  const rawMinutes = startMinutes + relativePosition * rangeMinutes
  const snappedMinutes = Math.round(rawMinutes / snapMinutes) * snapMinutes
  const latestStartMinutes = endMinutes - snapMinutes
  const clampedMinutes = Math.min(
    latestStartMinutes,
    Math.max(startMinutes, snappedMinutes),
  )
  const hour = Math.floor(clampedMinutes / 60)
  const minute = clampedMinutes % 60

  return {
    hour,
    minute,
    timeString: `${`${hour}`.padStart(2, '0')}:${`${minute}`.padStart(2, '0')}`,
  }
}
