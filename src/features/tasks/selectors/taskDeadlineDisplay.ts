import { format, isSameDay, isValid, parseISO } from 'date-fns'

export type TaskDeadlineDisplay =
  | { kind: 'none'; label: '' }
  | { kind: 'upcoming' | 'today' | 'soon' | 'overdue'; label: string }

const SOON_THRESHOLD_MS = 24 * 60 * 60 * 1_000

const none = (): TaskDeadlineDisplay => ({ kind: 'none', label: '' })

export const getTaskDeadlineDisplay = (
  deadline?: string,
  nowIso = new Date().toISOString(),
): TaskDeadlineDisplay => {
  if (!deadline) {
    return none()
  }

  const deadlineDate = parseISO(deadline)
  const now = parseISO(nowIso)
  if (!isValid(deadlineDate) || !isValid(now)) {
    return none()
  }

  const formattedDateTime = format(deadlineDate, 'yyyy/MM/dd HH:mm')
  const remainingMilliseconds = deadlineDate.getTime() - now.getTime()

  if (remainingMilliseconds <= 0) {
    return {
      kind: 'overdue',
      label: `已逾期，原截止 ${formattedDateTime}`,
    }
  }

  if (isSameDay(deadlineDate, now)) {
    return {
      kind: 'today',
      label: `今天截止 ${format(deadlineDate, 'HH:mm')}`,
    }
  }

  if (remainingMilliseconds <= SOON_THRESHOLD_MS) {
    return {
      kind: 'soon',
      label: `即將截止 ${formattedDateTime}`,
    }
  }

  return {
    kind: 'upcoming',
    label: `截止 ${formattedDateTime}`,
  }
}
