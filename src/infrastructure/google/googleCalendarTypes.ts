export interface GoogleCalendarEventDateTimeDto {
  date?: string
  dateTime?: string
  timeZone?: string
}

export interface GoogleCalendarEventDto {
  id?: string
  summary?: string
  location?: string
  start?: GoogleCalendarEventDateTimeDto
  end?: GoogleCalendarEventDateTimeDto
}

export interface GoogleCalendarEventsListDto {
  items?: GoogleCalendarEventDto[]
  nextPageToken?: string
}
