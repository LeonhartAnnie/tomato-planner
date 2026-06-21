import { describe, expect, it } from 'vitest'
import type { GoogleCalendarEventDto } from './googleCalendarTypes'
import { mapGoogleCalendarEvent } from './googleCalendarMapper'

const timedEvent: GoogleCalendarEventDto = {
  id: 'google-event-1',
  summary: 'Project sync',
  location: 'Meeting room A',
  start: { dateTime: '2026-06-21T09:00:00+08:00' },
  end: { dateTime: '2026-06-21T10:00:00+08:00' },
}

describe('mapGoogleCalendarEvent', () => {
  it('maps a timed event to CalendarEvent', () => {
    expect(mapGoogleCalendarEvent(timedEvent)).toEqual({
      id: 'google-event-1',
      title: 'Project sync',
      start: '2026-06-21T09:00:00+08:00',
      end: '2026-06-21T10:00:00+08:00',
      location: 'Meeting room A',
      source: 'google_calendar',
      readonly: true,
    })
  })

  it('uses a fallback title when summary is missing', () => {
    expect(
      mapGoogleCalendarEvent({ ...timedEvent, summary: undefined })?.title,
    ).toBe('(No title)')
  })

  it('maps an optional location', () => {
    expect(mapGoogleCalendarEvent(timedEvent)?.location).toBe('Meeting room A')
  })

  it('always marks mapped events as readonly', () => {
    expect(mapGoogleCalendarEvent(timedEvent)?.readonly).toBe(true)
  })

  it('always marks the source as google_calendar', () => {
    expect(mapGoogleCalendarEvent(timedEvent)?.source).toBe('google_calendar')
  })

  it('maps an all-day event to local midnight boundaries', () => {
    const mapped = mapGoogleCalendarEvent({
      id: 'all-day-1',
      summary: 'Holiday',
      start: { date: '2026-06-21' },
      end: { date: '2026-06-22' },
    })

    expect(mapped).toMatchObject({
      start: new Date('2026-06-21T00:00:00').toISOString(),
      end: new Date('2026-06-22T00:00:00').toISOString(),
    })
  })

  it.each([
    { ...timedEvent, start: undefined },
    { ...timedEvent, end: undefined },
    { ...timedEvent, start: {} },
    { ...timedEvent, id: undefined },
  ])('skips an event with missing required data', (event) => {
    expect(mapGoogleCalendarEvent(event)).toBeUndefined()
  })
})
