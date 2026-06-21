import { describe, expect, it } from 'vitest'
import { defaultSettings } from '../../domain/settings/defaultSettings'
import type { CloudBackupData } from './syncTypes'
import {
  assertCloudBackupData,
  isCloudBackupData,
} from './validateCloudBackupData'

const validBackup: CloudBackupData = {
  version: 1,
  updatedAt: '2026-06-21T12:00:00.000Z',
  tasks: [
    {
      id: 'task-1',
      title: 'Valid task',
      estimatedMinutes: 25,
      splittable: false,
      createdAt: '2026-06-20T00:00:00.000Z',
      updatedAt: '2026-06-20T00:00:00.000Z',
    },
  ],
  scheduledBlocks: [
    {
      id: 'block-1',
      taskId: 'task-1',
      title: 'Valid block',
      start: '2026-06-21T01:00:00.000Z',
      end: '2026-06-21T01:25:00.000Z',
      source: 'manual',
      syncedToGoogleCalendar: false,
      createdAt: '2026-06-20T00:00:00.000Z',
      updatedAt: '2026-06-20T00:00:00.000Z',
    },
  ],
  settings: defaultSettings,
  pomodoroSessions: [
    {
      id: 'session-1',
      type: 'focus',
      startedAt: '2026-06-21T01:00:00.000Z',
      endedAt: '2026-06-21T01:25:00.000Z',
      completed: true,
    },
  ],
}

describe('CloudBackupData runtime validation', () => {
  it('accepts a valid backup', () => {
    expect(isCloudBackupData(validBackup)).toBe(true)
    expect(assertCloudBackupData(validBackup)).toBe(validBackup)
  })

  it.each([null, undefined, true, 1, 'backup', []])(
    'rejects null, primitives, and arrays',
    (value) => {
      expect(isCloudBackupData(value)).toBe(false)
    },
  )

  it('rejects a version other than 1', () => {
    expect(isCloudBackupData({ ...validBackup, version: 2 })).toBe(false)
  })

  it('rejects an invalid updatedAt', () => {
    expect(isCloudBackupData({ ...validBackup, updatedAt: 'invalid' })).toBe(
      false,
    )
  })

  it('rejects tasks that are not an array', () => {
    expect(isCloudBackupData({ ...validBackup, tasks: {} })).toBe(false)
  })

  it('rejects a task missing required fields', () => {
    expect(
      isCloudBackupData({ ...validBackup, tasks: [{ id: 'task-1' }] }),
    ).toBe(false)
  })

  it('rejects a scheduled block missing required fields', () => {
    expect(
      isCloudBackupData({
        ...validBackup,
        scheduledBlocks: [{ id: 'block-1' }],
      }),
    ).toBe(false)
  })

  it('rejects settings missing required fields', () => {
    expect(
      isCloudBackupData({
        ...validBackup,
        settings: { workMinutes: 25 },
      }),
    ).toBe(false)
  })

  it('rejects a Pomodoro session missing required fields', () => {
    expect(
      isCloudBackupData({
        ...validBackup,
        pomodoroSessions: [{ id: 'session-1' }],
      }),
    ).toBe(false)
  })

  it.each(['calendarEvents', 'activeTimer', 'nextStep', 'lastCompletedSession'])(
    'rejects the forbidden backup field %s',
    (key) => {
      expect(isCloudBackupData({ ...validBackup, [key]: {} })).toBe(false)
    },
  )

  it('throws for an invalid backup', () => {
    expect(() => assertCloudBackupData({ ...validBackup, tasks: null })).toThrow(
      'Invalid CloudBackupData',
    )
  })
})
