import { describe, expect, it } from 'vitest'
import type { CalendarEvent, ScheduledBlock } from '../../types'
import { checkScheduleConflict } from './checkScheduleConflict'

const scheduledBlock: ScheduledBlock = {
  id: 'block-1',
  taskId: 'task-1',
  title: '既有排程',
  start: '2026-06-20T09:00:00.000Z',
  end: '2026-06-20T10:00:00.000Z',
  source: 'manual',
  syncedToGoogleCalendar: false,
  createdAt: '2026-06-20T00:00:00.000Z',
  updatedAt: '2026-06-20T00:00:00.000Z',
}

const calendarEvent: CalendarEvent = {
  id: 'event-1',
  title: '會議',
  start: '2026-06-20T11:00:00.000Z',
  end: '2026-06-20T12:00:00.000Z',
  source: 'google_calendar',
  readonly: true,
}

describe('checkScheduleConflict', () => {
  it('returns a conflicting scheduled block', () => {
    const conflicts = checkScheduleConflict(
      { start: '2026-06-20T09:30:00.000Z', end: '2026-06-20T10:30:00.000Z' },
      [scheduledBlock],
      [],
    )

    expect(conflicts).toEqual([
      expect.objectContaining({ id: scheduledBlock.id, source: 'scheduled_block' }),
    ])
  })

  it('returns a conflicting calendar event', () => {
    const conflicts = checkScheduleConflict(
      { start: '2026-06-20T11:30:00.000Z', end: '2026-06-20T12:30:00.000Z' },
      [],
      [calendarEvent],
    )

    expect(conflicts).toEqual([
      expect.objectContaining({ id: calendarEvent.id, source: 'calendar_event' }),
    ])
  })

  it('does not treat touching boundaries as a conflict', () => {
    const conflicts = checkScheduleConflict(
      { start: scheduledBlock.end, end: '2026-06-20T11:00:00.000Z' },
      [scheduledBlock],
      [],
    )
    expect(conflicts).toEqual([])
  })

  it('does not conflict when target ends as another event starts', () => {
    const conflicts = checkScheduleConflict(
      { start: '2026-06-20T10:00:00.000Z', end: calendarEvent.start },
      [],
      [calendarEvent],
    )
    expect(conflicts).toEqual([])
  })

  it('returns an empty array when nothing overlaps', () => {
    const conflicts = checkScheduleConflict(
      { start: '2026-06-20T13:00:00.000Z', end: '2026-06-20T14:00:00.000Z' },
      [scheduledBlock],
      [calendarEvent],
    )
    expect(conflicts).toEqual([])
  })
})
