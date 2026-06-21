import { describe, expect, it } from 'vitest'
import { defaultSettings } from '../../domain/settings/defaultSettings'
import type { LocalAppDataSnapshot } from './localAppDataRepository'
import { getLocalAppDataUpdatedAt } from './getLocalAppDataUpdatedAt'

const epoch = '1970-01-01T00:00:00.000Z'

const emptySnapshot = (): LocalAppDataSnapshot => ({
  tasks: [],
  scheduledBlocks: [],
  settings: defaultSettings,
  pomodoroSessions: [],
})

describe('getLocalAppDataUpdatedAt', () => {
  it('uses the latest task updatedAt', () => {
    const snapshot = emptySnapshot()
    snapshot.tasks = [
      {
        id: 'task-1',
        title: 'Task',
        estimatedMinutes: 25,
        splittable: false,
        createdAt: '2026-06-20T08:00:00.000Z',
        updatedAt: '2026-06-21T09:00:00.000Z',
      },
    ]

    expect(getLocalAppDataUpdatedAt(snapshot)).toBe(
      '2026-06-21T09:00:00.000Z',
    )
  })

  it('uses the latest scheduled block updatedAt', () => {
    const snapshot = emptySnapshot()
    snapshot.scheduledBlocks = [
      {
        id: 'block-1',
        taskId: 'task-1',
        title: 'Block',
        start: '2026-06-21T09:00:00.000Z',
        end: '2026-06-21T09:25:00.000Z',
        source: 'manual',
        syncedToGoogleCalendar: false,
        createdAt: '2026-06-20T08:00:00.000Z',
        updatedAt: '2026-06-21T10:00:00.000Z',
      },
    ]

    expect(getLocalAppDataUpdatedAt(snapshot)).toBe(
      '2026-06-21T10:00:00.000Z',
    )
  })

  it('prefers a completed session endedAt', () => {
    const snapshot = emptySnapshot()
    snapshot.pomodoroSessions = [
      {
        id: 'session-1',
        type: 'focus',
        startedAt: '2026-06-21T10:00:00.000Z',
        endedAt: '2026-06-21T10:25:00.000Z',
        completed: true,
      },
    ]

    expect(getLocalAppDataUpdatedAt(snapshot)).toBe(
      '2026-06-21T10:25:00.000Z',
    )
  })

  it('uses session startedAt when endedAt is absent', () => {
    const snapshot = emptySnapshot()
    snapshot.pomodoroSessions = [
      {
        id: 'session-1',
        type: 'focus',
        startedAt: '2026-06-21T11:00:00.000Z',
        completed: false,
      },
    ]

    expect(getLocalAppDataUpdatedAt(snapshot)).toBe(
      '2026-06-21T11:00:00.000Z',
    )
  })

  it('returns the Unix epoch when app-owned collections are empty', () => {
    expect(getLocalAppDataUpdatedAt(emptySnapshot())).toBe(epoch)
  })

  it('rejects an invalid app data timestamp', () => {
    const snapshot = emptySnapshot()
    snapshot.tasks = [
      {
        id: 'task-1',
        title: 'Task',
        estimatedMinutes: 25,
        splittable: false,
        createdAt: '2026-06-20T08:00:00.000Z',
        updatedAt: 'invalid-date',
      },
    ]

    expect(() => getLocalAppDataUpdatedAt(snapshot)).toThrow(
      'Invalid app data timestamp: invalid-date',
    )
  })

  it('does not include CalendarEvent timestamps', () => {
    const snapshot = {
      ...emptySnapshot(),
      calendarEvents: [{ start: '2099-01-01T00:00:00.000Z' }],
    }

    expect(getLocalAppDataUpdatedAt(snapshot)).toBe(epoch)
  })

  it('does not include active timer timestamps', () => {
    const snapshot = {
      ...emptySnapshot(),
      activeTimer: { startedAt: '2099-01-01T00:00:00.000Z' },
    }

    expect(getLocalAppDataUpdatedAt(snapshot)).toBe(epoch)
  })
})
