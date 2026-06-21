import { describe, expect, it } from 'vitest'
import { defaultSettings } from '../../domain/settings/defaultSettings'
import { resolveBackupConflict } from './resolveBackupConflict'
import type { CloudBackupData } from './syncTypes'

const createBackup = (updatedAt: string): CloudBackupData => ({
  version: 1,
  updatedAt,
  tasks: [],
  scheduledBlocks: [],
  settings: defaultSettings,
  pomodoroSessions: [],
})

describe('resolveBackupConflict', () => {
  const localBackup = createBackup('2026-06-21T10:00:00.000Z')

  it('uses local when no cloud backup exists', () => {
    expect(resolveBackupConflict(localBackup)).toBe(localBackup)
  })

  it('uses cloud when cloud is newer', () => {
    const cloudBackup = createBackup('2026-06-21T11:00:00.000Z')
    expect(resolveBackupConflict(localBackup, cloudBackup)).toBe(cloudBackup)
  })

  it('uses local when local is newer', () => {
    const cloudBackup = createBackup('2026-06-21T09:00:00.000Z')
    expect(resolveBackupConflict(localBackup, cloudBackup)).toBe(localBackup)
  })

  it('uses local when updatedAt values are equal', () => {
    const cloudBackup = createBackup(localBackup.updatedAt)
    expect(resolveBackupConflict(localBackup, cloudBackup)).toBe(localBackup)
  })

  it('rejects an invalid updatedAt value', () => {
    expect(() =>
      resolveBackupConflict(createBackup('not-a-date')),
    ).toThrow('Invalid backup updatedAt: not-a-date')
  })
})
