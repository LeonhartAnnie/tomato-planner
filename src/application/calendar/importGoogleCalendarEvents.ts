import { mapGoogleCalendarEvent } from '../../infrastructure/google/googleCalendarMapper'
import type { CalendarEvent } from '../../types'
import type { CalendarGateway } from './calendarGateway'

export interface ImportGoogleCalendarEventsInput {
  gateway: CalendarGateway
  startIso: string
  endIso: string
}

export const importGoogleCalendarEvents = async ({
  gateway,
  startIso,
  endIso,
}: ImportGoogleCalendarEventsInput): Promise<CalendarEvent[]> => {
  const events = await gateway.fetchEvents(startIso, endIso)

  return events.flatMap((event) => {
    const mappedEvent = mapGoogleCalendarEvent(event)
    return mappedEvent ? [mappedEvent] : []
  })
}
