import { describe, expect, it, vi } from 'vitest'
import type { CalendarGateway } from './calendarGateway'
import { importGoogleCalendarEvents } from './importGoogleCalendarEvents'

const startIso = '2026-06-21T00:00:00.000Z'
const endIso = '2026-06-28T00:00:00.000Z'

describe('importGoogleCalendarEvents', () => {
  it('maps events returned by the gateway', async () => {
    const gateway: CalendarGateway = {
      fetchEvents: vi.fn().mockResolvedValue([
        {
          id: 'event-1',
          summary: 'Imported event',
          start: { dateTime: '2026-06-21T09:00:00.000Z' },
          end: { dateTime: '2026-06-21T10:00:00.000Z' },
        },
      ]),
    }

    const events = await importGoogleCalendarEvents({
      gateway,
      startIso,
      endIso,
    })

    expect(gateway.fetchEvents).toHaveBeenCalledWith(startIso, endIso)
    expect(events).toEqual([
      expect.objectContaining({
        id: 'event-1',
        title: 'Imported event',
        source: 'google_calendar',
        readonly: true,
      }),
    ])
  })

  it('filters invalid Google events using the mapper policy', async () => {
    const gateway: CalendarGateway = {
      fetchEvents: vi.fn().mockResolvedValue([
        {
          id: 'invalid-event',
          summary: 'Missing end',
          start: { dateTime: '2026-06-21T09:00:00.000Z' },
        },
      ]),
    }

    await expect(
      importGoogleCalendarEvents({ gateway, startIso, endIso }),
    ).resolves.toEqual([])
  })

  it('propagates gateway errors without calling a real Google API', async () => {
    const gateway: CalendarGateway = {
      fetchEvents: vi.fn().mockRejectedValue(new Error('Authorization failed')),
    }

    await expect(
      importGoogleCalendarEvents({ gateway, startIso, endIso }),
    ).rejects.toThrow('Authorization failed')
  })
})
