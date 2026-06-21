import type { GoogleCalendarEventDto } from '../../infrastructure/google/googleCalendarTypes'

export interface CalendarGateway {
  fetchEvents(
    startIso: string,
    endIso: string,
  ): Promise<GoogleCalendarEventDto[]>
}
