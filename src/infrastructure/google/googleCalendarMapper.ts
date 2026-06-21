import type { CalendarEvent } from '../../types'
import type {
  GoogleCalendarEventDateTimeDto,
  GoogleCalendarEventDto,
} from './googleCalendarTypes'

const toEventDateTime = (
  value: GoogleCalendarEventDateTimeDto | undefined,
): string | undefined => {
  const source = value?.dateTime ?? (value?.date ? `${value.date}T00:00:00` : '')
  if (!source) {
    return undefined
  }

  const date = new Date(source)
  if (!Number.isFinite(date.getTime())) {
    return undefined
  }

  return value?.dateTime ?? date.toISOString()
}

export const mapGoogleCalendarEvent = (
  event: GoogleCalendarEventDto,
): CalendarEvent | undefined => {
  const start = toEventDateTime(event.start)
  const end = toEventDateTime(event.end)

  if (!event.id || !start || !end) {
    return undefined
  }

  return {
    id: event.id,
    title: event.summary?.trim() || '(No title)',
    start,
    end,
    location: event.location,
    source: 'google_calendar',
    readonly: true,
  }
}
