import { describe, expect, it } from 'vitest'
import {
  calculateTimeGridPosition,
  calculateTimeFromGridDrop,
  createHourlyTicks,
  formatDailySegmentTimeRange,
  splitEventIntoDailySegments,
} from './scheduleTimeGridHelpers'

const dateKeys = ['2026-06-21', '2026-06-22', '2026-06-23']

describe('scheduleTimeGridHelpers', () => {
  it('creates inclusive hourly ticks for the calendar range', () => {
    const ticks = createHourlyTicks(8, 11)

    expect(ticks.map(({ hour, label }) => ({ hour, label }))).toEqual([
      { hour: 8, label: '08:00' },
      { hour: 9, label: '09:00' },
      { hour: 10, label: '10:00' },
      { hour: 11, label: '11:00' },
    ])
    expect(ticks[1].offsetPercent).toBeCloseTo(100 / 3)
    expect(ticks[3].offsetPercent).toBe(100)
  })

  it('calculates an event top offset within the visible range', () => {
    const position = calculateTimeGridPosition(
      '2026-06-21T09:00:00',
      '2026-06-21T10:00:00',
      8,
      12,
    )

    expect(position.topPercent).toBe(25)
  })

  it('calculates an event height within the visible range', () => {
    const position = calculateTimeGridPosition(
      '2026-06-21T09:00:00',
      '2026-06-21T10:30:00',
      8,
      12,
    )

    expect(position.heightPercent).toBe(37.5)
    expect(position.hidden).toBe(false)
  })

  it('clamps an event that starts before the visible range', () => {
    const position = calculateTimeGridPosition(
      '2026-06-21T07:30:00',
      '2026-06-21T09:00:00',
      8,
      12,
    )

    expect(position).toEqual({
      topPercent: 0,
      heightPercent: 25,
      hidden: false,
    })
  })

  it('clamps an event that ends after the visible range', () => {
    const position = calculateTimeGridPosition(
      '2026-06-21T11:00:00',
      '2026-06-21T13:00:00',
      8,
      12,
    )

    expect(position).toEqual({
      topPercent: 75,
      heightPercent: 25,
      hidden: false,
    })
  })

  it('hides events completely before or after the visible range', () => {
    expect(
      calculateTimeGridPosition(
        '2026-06-21T06:00:00',
        '2026-06-21T07:00:00',
        8,
        12,
      ),
    ).toEqual({ topPercent: 0, heightPercent: 0, hidden: true })

    expect(
      calculateTimeGridPosition(
        '2026-06-21T13:00:00',
        '2026-06-21T14:00:00',
        8,
        12,
      ),
    ).toEqual({ topPercent: 100, heightPercent: 0, hidden: true })
  })

  it('rejects an invalid calendar range', () => {
    expect(() => createHourlyTicks(12, 8)).toThrow(
      'Invalid calendar view range',
    )
    expect(() => createHourlyTicks(8.5, 12)).toThrow(
      'Invalid calendar view range',
    )
  })

  it('rejects invalid event dates and ranges', () => {
    expect(() =>
      calculateTimeGridPosition('invalid', '2026-06-21T10:00:00', 8, 12),
    ).toThrow('Invalid schedule event date')
    expect(() =>
      calculateTimeGridPosition(
        '2026-06-21T10:00:00',
        '2026-06-21T09:00:00',
        8,
        12,
      ),
    ).toThrow('Invalid schedule event range')
  })

  it('keeps a same-day event as one segment', () => {
    const segments = splitEventIntoDailySegments(
      '2026-06-21T09:00:00',
      '2026-06-21T10:00:00',
      dateKeys,
    )

    expect(segments).toEqual([
      {
        dateKey: '2026-06-21',
        segmentStart: new Date('2026-06-21T09:00:00').toISOString(),
        segmentEnd: new Date('2026-06-21T10:00:00').toISOString(),
        continuesFromPreviousDay: false,
        continuesIntoNextDay: false,
      },
    ])
  })

  it('splits a 22:00 to 00:30 event into two daily segments', () => {
    const segments = splitEventIntoDailySegments(
      '2026-06-21T22:00:00',
      '2026-06-22T00:30:00',
      dateKeys,
    )

    expect(segments).toEqual([
      expect.objectContaining({
        dateKey: '2026-06-21',
        segmentStart: new Date('2026-06-21T22:00:00').toISOString(),
        segmentEnd: new Date('2026-06-22T00:00:00').toISOString(),
        continuesIntoNextDay: true,
      }),
      expect.objectContaining({
        dateKey: '2026-06-22',
        segmentStart: new Date('2026-06-22T00:00:00').toISOString(),
        segmentEnd: new Date('2026-06-22T00:30:00').toISOString(),
        continuesFromPreviousDay: true,
      }),
    ])
    expect(formatDailySegmentTimeRange(segments[0])).toBe('22:00–24:00')
    expect(formatDailySegmentTimeRange(segments[1])).toBe('00:00–00:30')
  })

  it('splits an event spanning three days into three segments', () => {
    const segments = splitEventIntoDailySegments(
      '2026-06-21T22:00:00',
      '2026-06-23T02:00:00',
      dateKeys,
    )

    expect(segments.map((segment) => segment.dateKey)).toEqual(dateKeys)
    expect(segments[1]).toMatchObject({
      continuesFromPreviousDay: true,
      continuesIntoNextDay: true,
    })
  })

  it('clamps an event beginning before the first visible date', () => {
    const segments = splitEventIntoDailySegments(
      '2026-06-20T22:00:00',
      '2026-06-21T01:00:00',
      dateKeys,
    )

    expect(segments).toHaveLength(1)
    expect(segments[0]).toMatchObject({
      dateKey: '2026-06-21',
      segmentStart: new Date('2026-06-21T00:00:00').toISOString(),
      continuesFromPreviousDay: true,
    })
  })

  it('clamps an event ending after the last visible date', () => {
    const segments = splitEventIntoDailySegments(
      '2026-06-23T23:00:00',
      '2026-06-24T02:00:00',
      dateKeys,
    )

    expect(segments).toHaveLength(1)
    expect(segments[0]).toMatchObject({
      dateKey: '2026-06-23',
      segmentEnd: new Date('2026-06-24T00:00:00').toISOString(),
      continuesIntoNextDay: true,
    })
  })

  it('returns no segments for an event outside the visible dates', () => {
    expect(
      splitEventIntoDailySegments(
        '2026-06-18T09:00:00',
        '2026-06-18T10:00:00',
        dateKeys,
      ),
    ).toEqual([])
  })

  it('combines daily segments with the visible hour range safely', () => {
    const segments = splitEventIntoDailySegments(
      '2026-06-21T22:00:00',
      '2026-06-22T00:30:00',
      dateKeys,
    )

    expect(
      calculateTimeGridPosition(
        segments[0].segmentStart,
        segments[0].segmentEnd,
        8,
        24,
      ),
    ).toMatchObject({ hidden: false, topPercent: 87.5 })
    expect(
      calculateTimeGridPosition(
        segments[1].segmentStart,
        segments[1].segmentEnd,
        8,
        24,
      ),
    ).toEqual({ topPercent: 0, heightPercent: 0, hidden: true })
  })

  it('rejects invalid dates when splitting daily segments', () => {
    expect(() =>
      splitEventIntoDailySegments(
        'invalid',
        '2026-06-21T10:00:00',
        dateKeys,
      ),
    ).toThrow('Invalid schedule event date')
  })

  describe('calculateTimeFromGridDrop', () => {
    const baseInput = {
      gridTop: 100,
      gridHeight: 600,
      startHour: 8,
      endHour: 18,
      snapMinutes: 15,
    }

    it('maps the top of the grid to startHour', () => {
      expect(
        calculateTimeFromGridDrop({ ...baseInput, pointerY: 100 }),
      ).toEqual({ hour: 8, minute: 0, timeString: '08:00' })
    })

    it('maps the middle of the grid to the middle time', () => {
      expect(
        calculateTimeFromGridDrop({ ...baseInput, pointerY: 400 }),
      ).toEqual({ hour: 13, minute: 0, timeString: '13:00' })
    })

    it('clamps the bottom to the last available slot', () => {
      expect(
        calculateTimeFromGridDrop({ ...baseInput, pointerY: 700 }),
      ).toEqual({ hour: 17, minute: 45, timeString: '17:45' })
    })

    it('snaps to the nearest 15 minutes', () => {
      expect(
        calculateTimeFromGridDrop({
          ...baseInput,
          gridTop: 0,
          gridHeight: 100,
          pointerY: 7,
        }),
      ).toEqual({ hour: 8, minute: 45, timeString: '08:45' })
    })

    it('supports a 30 minute snap', () => {
      expect(
        calculateTimeFromGridDrop({
          ...baseInput,
          gridTop: 0,
          gridHeight: 100,
          pointerY: 7,
          snapMinutes: 30,
        }),
      ).toEqual({ hour: 8, minute: 30, timeString: '08:30' })
    })

    it('clamps pointer positions above and below the grid', () => {
      expect(
        calculateTimeFromGridDrop({ ...baseInput, pointerY: 0 }).timeString,
      ).toBe('08:00')
      expect(
        calculateTimeFromGridDrop({ ...baseInput, pointerY: 900 }).timeString,
      ).toBe('17:45')
    })

    it('never returns 24:00 when endHour is 24', () => {
      expect(
        calculateTimeFromGridDrop({
          ...baseInput,
          pointerY: 700,
          endHour: 24,
        }).timeString,
      ).toBe('23:45')
    })

    it('uses a 15 minute snap by default', () => {
      const { snapMinutes: _snapMinutes, ...input } = baseInput
      expect(
        calculateTimeFromGridDrop({ ...input, pointerY: 700 }).timeString,
      ).toBe('17:45')
    })

    it('rejects an invalid grid height', () => {
      expect(() =>
        calculateTimeFromGridDrop({
          ...baseInput,
          pointerY: 100,
          gridHeight: 0,
        }),
      ).toThrow('Invalid time grid height')
    })

    it('rejects an invalid calendar range', () => {
      expect(() =>
        calculateTimeFromGridDrop({
          ...baseInput,
          pointerY: 100,
          startHour: 18,
        }),
      ).toThrow('Invalid calendar view range')
    })

    it('rejects invalid snap minutes', () => {
      expect(() =>
        calculateTimeFromGridDrop({
          ...baseInput,
          pointerY: 100,
          snapMinutes: 0,
        }),
      ).toThrow('Invalid time grid snap minutes')
    })
  })
})
