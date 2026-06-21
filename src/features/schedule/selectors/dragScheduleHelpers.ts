import { addMinutes, format, isValid, parse } from 'date-fns'
import type { ScheduledBlock, Task } from '../../../types'

const DATE_TIME_LOCAL_FORMAT = "yyyy-MM-dd'T'HH:mm"
const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/

const isPositiveFiniteNumber = (value: number): boolean =>
  Number.isFinite(value) && value > 0

export const toScheduleStartIso = (
  dateKey: string,
  time: string,
): string => {
  if (!TIME_PATTERN.test(time)) {
    throw new Error(`Invalid schedule time: ${time}`)
  }

  const localDateTime = `${dateKey}T${time}`
  const date = parse(localDateTime, DATE_TIME_LOCAL_FORMAT, new Date(0))
  if (!isValid(date) || format(date, DATE_TIME_LOCAL_FORMAT) !== localDateTime) {
    throw new Error(`Invalid schedule date: ${dateKey}`)
  }

  return date.toISOString()
}

export const getTaskScheduleDurationMinutes = (
  task: Task,
  defaultDurationMinutes: number,
): number => {
  if (isPositiveFiniteNumber(task.estimatedMinutes)) {
    return task.estimatedMinutes
  }
  if (!isPositiveFiniteNumber(defaultDurationMinutes)) {
    throw new Error('Invalid default task duration')
  }
  return defaultDurationMinutes
}

export interface DroppedTaskTimeRange {
  start: string
  end: string
  durationMinutes: number
}

export const createDroppedTaskTimeRange = (
  dateKey: string,
  time: string,
  task: Task,
  defaultDurationMinutes: number,
): DroppedTaskTimeRange => {
  const start = toScheduleStartIso(dateKey, time)
  const durationMinutes = getTaskScheduleDurationMinutes(
    task,
    defaultDurationMinutes,
  )

  return {
    start,
    end: addMinutes(new Date(start), durationMinutes).toISOString(),
    durationMinutes,
  }
}

export const getScheduledBlockDurationMinutes = (
  block: ScheduledBlock,
): number => {
  const startTime = new Date(block.start).getTime()
  const endTime = new Date(block.end).getTime()
  const durationMinutes = (endTime - startTime) / 60_000

  if (!isPositiveFiniteNumber(durationMinutes)) {
    throw new Error('Invalid scheduled block duration')
  }

  return durationMinutes
}

export const createRescheduledBlockTimeRange = (
  block: ScheduledBlock,
  dateKey: string,
  time: string,
): DroppedTaskTimeRange => {
  const start = toScheduleStartIso(dateKey, time)
  const durationMinutes = getScheduledBlockDurationMinutes(block)

  return {
    start,
    end: addMinutes(new Date(start), durationMinutes).toISOString(),
    durationMinutes,
  }
}
