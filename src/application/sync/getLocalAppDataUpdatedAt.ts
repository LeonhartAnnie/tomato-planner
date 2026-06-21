import { isValid, parseISO } from 'date-fns'
import type { LocalAppDataSnapshot } from './localAppDataRepository'

export const APP_DATA_EPOCH = '1970-01-01T00:00:00.000Z'

interface TimestampCandidate {
  value: string
  timestamp: number
}

const toTimestampCandidate = (value: unknown): TimestampCandidate => {
  if (typeof value !== 'string') {
    throw new Error(`Invalid app data timestamp: ${String(value)}`)
  }

  const date = parseISO(value)
  if (!isValid(date)) {
    throw new Error(`Invalid app data timestamp: ${value}`)
  }

  return { value, timestamp: date.getTime() }
}

export const getLocalAppDataUpdatedAt = (
  snapshot: LocalAppDataSnapshot,
): string => {
  const candidates = [
    ...snapshot.tasks.map((task) => task.updatedAt),
    ...snapshot.scheduledBlocks.map((block) => block.updatedAt),
    ...snapshot.pomodoroSessions.map(
      (session) => session.endedAt ?? session.startedAt,
    ),
  ].map(toTimestampCandidate)

  if (candidates.length === 0) {
    return APP_DATA_EPOCH
  }

  return candidates.reduce((latest, candidate) =>
    candidate.timestamp > latest.timestamp ? candidate : latest,
  ).value
}
