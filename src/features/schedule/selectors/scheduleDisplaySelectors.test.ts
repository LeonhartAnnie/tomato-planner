import { describe, expect, it } from 'vitest'
import type { CalendarEvent, ScheduledBlock } from '../../../types'
import {
  addConflictInfoToScheduleItems,
  formatScheduleTimeRange,
  getNextSevenDays,
  groupScheduleItemsByDate,
  groupScheduledBlocksByDate,
} from './scheduleDisplaySelectors'

const createBlock = (
  id: string,
  start: string,
  end: string,
): ScheduledBlock => ({
  id,
  taskId: `task-${id}`,
  title: `Block ${id}`,
  start,
  end,
  source: 'manual',
  syncedToGoogleCalendar: false,
  createdAt: '2026-06-20T00:00:00.000Z',
  updatedAt: '2026-06-20T00:00:00.000Z',
})

describe('schedule display conflict information', () => {
  const dateKeys = ['2026-06-21', '2026-06-22']

  it('marks an overlapping scheduled block and calendar event on both sides', () => {
    const block = createBlock(
      'block-event-overlap',
      '2026-06-21T09:00:00+08:00',
      '2026-06-21T10:00:00+08:00',
    )
    const event = createCalendarEvent(
      'event-block-overlap',
      '2026-06-21T09:30:00+08:00',
      '2026-06-21T10:30:00+08:00',
    )

    const items = groupScheduleItemsByDate([block], [event], dateKeys)[0].items

    expect(items.every((item) => item.hasConflict)).toBe(true)
  })

  it('marks overlapping scheduled blocks on both sides', () => {
    const first = createBlock(
      'block-first',
      '2026-06-21T09:00:00+08:00',
      '2026-06-21T10:00:00+08:00',
    )
    const second = createBlock(
      'block-second',
      '2026-06-21T09:45:00+08:00',
      '2026-06-21T10:30:00+08:00',
    )

    const items = groupScheduleItemsByDate(
      [first, second],
      [],
      dateKeys,
    )[0].items

    expect(items.every((item) => item.hasConflict)).toBe(true)
  })

  it('marks overlapping calendar events on both sides', () => {
    const first = createCalendarEvent(
      'event-first',
      '2026-06-21T09:00:00+08:00',
      '2026-06-21T10:00:00+08:00',
    )
    const second = createCalendarEvent(
      'event-second',
      '2026-06-21T09:15:00+08:00',
      '2026-06-21T09:45:00+08:00',
    )

    const items = groupScheduleItemsByDate(
      [],
      [first, second],
      dateKeys,
    )[0].items

    expect(items.every((item) => item.hasConflict)).toBe(true)
  })

  it('does not mark adjacent items whose end equals the next start', () => {
    const block = createBlock(
      'adjacent-block',
      '2026-06-21T09:00:00+08:00',
      '2026-06-21T10:00:00+08:00',
    )
    const event = createCalendarEvent(
      'adjacent-event',
      '2026-06-21T10:00:00+08:00',
      '2026-06-21T11:00:00+08:00',
    )

    const items = groupScheduleItemsByDate([block], [event], dateKeys)[0].items

    expect(items.every((item) => !item.hasConflict)).toBe(true)
  })

  it('leaves non-overlapping items without conflicts', () => {
    const block = createBlock(
      'separate-block',
      '2026-06-21T09:00:00+08:00',
      '2026-06-21T10:00:00+08:00',
    )
    const event = createCalendarEvent(
      'separate-event',
      '2026-06-21T11:00:00+08:00',
      '2026-06-21T12:00:00+08:00',
    )

    const items = groupScheduleItemsByDate([block], [event], dateKeys)[0].items

    expect(items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ hasConflict: false, conflicts: [] }),
      ]),
    )
    expect(items.every((item) => !item.hasConflict)).toBe(true)
  })

  it('includes the correct conflict id, title, and kind', () => {
    const block = createBlock(
      'summary-block',
      '2026-06-21T09:00:00+08:00',
      '2026-06-21T10:00:00+08:00',
    )
    const event = createCalendarEvent(
      'summary-event',
      '2026-06-21T09:30:00+08:00',
      '2026-06-21T10:30:00+08:00',
    )

    const blockItem = groupScheduleItemsByDate(
      [block],
      [event],
      dateKeys,
    )[0].items.find((item) => item.kind === 'scheduled_block')

    expect(blockItem?.conflicts).toContainEqual(
      expect.objectContaining({
        id: event.id,
        title: event.title,
        kind: 'calendar_event',
      }),
    )
  })

  it('does not duplicate a conflict summary', () => {
    const block = createBlock(
      'unique-block',
      '2026-06-21T09:00:00+08:00',
      '2026-06-21T11:00:00+08:00',
    )
    const event = createCalendarEvent(
      'unique-event',
      '2026-06-21T09:30:00+08:00',
      '2026-06-21T10:30:00+08:00',
    )
    const items = groupScheduleItemsByDate([block], [event], dateKeys)[0].items

    const enrichedAgain = addConflictInfoToScheduleItems(items)
    const blockItem = enrichedAgain.find(
      (item) => item.kind === 'scheduled_block',
    )

    expect(blockItem?.conflicts).toHaveLength(1)
  })

  it('does not compare overlapping time ranges assigned to different dates', () => {
    const overnightEvent = createCalendarEvent(
      'overnight-event',
      '2026-06-21T23:00:00+08:00',
      '2026-06-22T01:00:00+08:00',
    )
    const nextDayBlock = createBlock(
      'next-day-block',
      '2026-06-22T00:30:00+08:00',
      '2026-06-22T01:30:00+08:00',
    )

    const groups = groupScheduleItemsByDate(
      [nextDayBlock],
      [overnightEvent],
      dateKeys,
    )

    expect(groups.flatMap((group) => group.items).every((item) => !item.hasConflict)).toBe(true)
  })
})

function createCalendarEvent(
  id: string,
  start: string,
  end: string,
): CalendarEvent {
  return {
    id,
    title: `Event ${id}`,
    start,
    end,
    source: 'google_calendar',
    readonly: true,
  }
}

describe('getNextSevenDays', () => {
  it('returns seven date keys starting at the base date', () => {
    expect(getNextSevenDays('2026-06-21T12:00:00+08:00')).toEqual([
      '2026-06-21',
      '2026-06-22',
      '2026-06-23',
      '2026-06-24',
      '2026-06-25',
      '2026-06-26',
      '2026-06-27',
    ])
  })
})

describe('groupScheduledBlocksByDate', () => {
  const dateKeys = [
    '2026-06-21',
    '2026-06-22',
    '2026-06-23',
    '2026-06-24',
    '2026-06-25',
    '2026-06-26',
    '2026-06-27',
  ]
  const laterBlock = createBlock(
    'later',
    '2026-06-21T15:00:00+08:00',
    '2026-06-21T16:00:00+08:00',
  )
  const earlierBlock = createBlock(
    'earlier',
    '2026-06-21T09:00:00+08:00',
    '2026-06-21T10:00:00+08:00',
  )
  const outsideBlock = createBlock(
    'outside',
    '2026-06-28T09:00:00+08:00',
    '2026-06-28T10:00:00+08:00',
  )

  it('groups blocks by their start date and excludes outside blocks', () => {
    const groups = groupScheduledBlocksByDate(
      [earlierBlock, outsideBlock],
      dateKeys,
    )

    expect(groups[0].blocks).toEqual([earlierBlock])
    expect(groups.flatMap((group) => group.blocks)).not.toContain(outsideBlock)
  })

  it('sorts each day from earliest to latest', () => {
    const groups = groupScheduledBlocksByDate(
      [laterBlock, earlierBlock],
      dateKeys,
    )
    expect(groups[0].blocks).toEqual([earlierBlock, laterBlock])
  })

  it('keeps dates with no blocks', () => {
    const groups = groupScheduledBlocksByDate([earlierBlock], dateKeys)
    expect(groups).toHaveLength(7)
    expect(groups[1]).toEqual({ dateKey: '2026-06-22', blocks: [] })
  })
})

describe('formatScheduleTimeRange', () => {
  it('formats a compact local time range', () => {
    expect(
      formatScheduleTimeRange(
        '2026-06-21T09:00:00+08:00',
        '2026-06-21T10:30:00+08:00',
      ),
    ).toBe('09:00–10:30')
  })
})

describe('groupScheduleItemsByDate', () => {
  const dateKeys = ['2026-06-21', '2026-06-22', '2026-06-23']
  const block = createBlock(
    'block',
    '2026-06-21T10:00:00+08:00',
    '2026-06-21T11:00:00+08:00',
  )
  const event = createCalendarEvent(
    'event',
    '2026-06-22T09:00:00+08:00',
    '2026-06-22T10:00:00+08:00',
  )

  it('groups scheduled blocks', () => {
    const groups = groupScheduleItemsByDate([block], [], dateKeys)

    expect(groups[0].items).toEqual([
      expect.objectContaining({ kind: 'scheduled_block', block }),
    ])
  })

  it('groups calendar events', () => {
    const groups = groupScheduleItemsByDate([], [event], dateKeys)

    expect(groups[1].items).toEqual([
      expect.objectContaining({ kind: 'calendar_event', event }),
    ])
  })

  it('includes scheduled blocks and calendar events together', () => {
    const sameDayEvent = createCalendarEvent(
      'same-day',
      '2026-06-21T12:00:00+08:00',
      '2026-06-21T13:00:00+08:00',
    )
    const groups = groupScheduleItemsByDate([block], [sameDayEvent], dateKeys)

    expect(groups[0].items.map((item) => item.kind)).toEqual([
      'scheduled_block',
      'calendar_event',
    ])
  })

  it('excludes items outside the requested dates', () => {
    const outsideEvent = createCalendarEvent(
      'outside',
      '2026-06-24T09:00:00+08:00',
      '2026-06-24T10:00:00+08:00',
    )
    const groups = groupScheduleItemsByDate([], [outsideEvent], dateKeys)

    expect(groups.flatMap((group) => group.items)).toEqual([])
  })

  it('sorts all items by start time', () => {
    const earlyEvent = createCalendarEvent(
      'early',
      '2026-06-21T08:00:00+08:00',
      '2026-06-21T09:00:00+08:00',
    )
    const groups = groupScheduleItemsByDate([block], [earlyEvent], dateKeys)

    expect(groups[0].items.map((item) => item.id)).toEqual(['early', 'block'])
  })

  it('sorts calendar events before scheduled blocks at the same time', () => {
    const simultaneousEvent = createCalendarEvent(
      'simultaneous',
      block.start,
      block.end,
    )
    const groups = groupScheduleItemsByDate(
      [block],
      [simultaneousEvent],
      dateKeys,
    )

    expect(groups[0].items.map((item) => item.kind)).toEqual([
      'calendar_event',
      'scheduled_block',
    ])
  })

  it('keeps dates without items', () => {
    const groups = groupScheduleItemsByDate([block], [], dateKeys)

    expect(groups[2]).toEqual({ dateKey: '2026-06-23', items: [] })
  })

  it('marks calendar event display items as readonly', () => {
    const groups = groupScheduleItemsByDate([], [event], dateKeys)

    expect(groups[1].items[0]).toMatchObject({
      kind: 'calendar_event',
      readonly: true,
    })
  })
})
