import { describe, expect, it } from 'vitest'
import { defaultSettings } from '../../domain/settings/defaultSettings'
import type { CloudBackupData } from './syncTypes'
import {
  parseCloudBackupDataJson,
  serializeCloudBackupData,
} from './cloudBackupJsonCodec'

const validBackup: CloudBackupData = {
  version: 1,
  updatedAt: '2026-06-21T12:00:00.000Z',
  tasks: [],
  scheduledBlocks: [],
  settings: defaultSettings,
  pomodoroSessions: [],
}

describe('CloudBackupData JSON codec', () => {
  it('round-trips a valid backup', () => {
    const json = serializeCloudBackupData(validBackup)
    expect(parseCloudBackupDataJson(json)).toEqual(validBackup)
  })

  it('rejects invalid JSON', () => {
    expect(() => parseCloudBackupDataJson('{invalid')).toThrow(
      'Invalid cloud backup JSON',
    )
  })

  it.each(['null', 'true', '1', '"backup"', '[]'])(
    'rejects a primitive or array JSON value',
    (json) => {
      expect(() => parseCloudBackupDataJson(json)).toThrow(
        'Cloud backup must be an object',
      )
    },
  )

  it('rejects an invalid backup shape', () => {
    expect(() =>
      parseCloudBackupDataJson(
        JSON.stringify({ ...validBackup, tasks: 'not-an-array' }),
      ),
    ).toThrow('Invalid CloudBackupData')
  })

  it('rejects JSON containing CalendarEvent data', () => {
    expect(() =>
      parseCloudBackupDataJson(
        JSON.stringify({ ...validBackup, calendarEvents: [] }),
      ),
    ).toThrow('Invalid CloudBackupData')
  })

  it('rejects JSON containing active timer state', () => {
    expect(() =>
      parseCloudBackupDataJson(
        JSON.stringify({ ...validBackup, activeTimer: {} }),
      ),
    ).toThrow('Invalid CloudBackupData')
  })

  it('rejects invalid data before serialization', () => {
    const invalidBackup = {
      ...validBackup,
      nextStep: {},
    } as unknown as CloudBackupData

    expect(() => serializeCloudBackupData(invalidBackup)).toThrow(
      'Invalid CloudBackupData',
    )
  })
})
