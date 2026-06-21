import { describe, expect, it, vi } from 'vitest'
import { defaultSettings } from '../../domain/settings/defaultSettings'
import type { CloudBackupRepository } from './cloudBackupRepository'
import { getCloudBackupSummary } from './getCloudBackupSummary'

const backup = {
  version: 1 as const,
  updatedAt: '2026-06-21T12:00:00.000Z',
  tasks: [{
    id: 'task-1', title: 'Task', estimatedMinutes: 25, splittable: false,
    createdAt: '2026-06-21T08:00:00.000Z',
    updatedAt: '2026-06-21T09:00:00.000Z',
  }],
  scheduledBlocks: [],
  settings: defaultSettings,
  pomodoroSessions: [],
}

describe('getCloudBackupSummary', () => {
  it('returns a summary for an existing validated backup', async () => {
    const repository: CloudBackupRepository = {
      getBackup: vi.fn().mockResolvedValue(backup), saveBackup: vi.fn(),
    }

    await expect(getCloudBackupSummary(repository)).resolves.toEqual({
      taskCount: 1,
      scheduledBlockCount: 0,
      pomodoroSessionCount: 0,
      hasSettings: true,
      latestDataUpdatedAt: backup.updatedAt,
    })
  })

  it('returns undefined when no cloud backup exists', async () => {
    const repository: CloudBackupRepository = {
      getBackup: vi.fn().mockResolvedValue(undefined), saveBackup: vi.fn(),
    }
    await expect(getCloudBackupSummary(repository)).resolves.toBeUndefined()
  })

  it('propagates repository parsing or validation failures', async () => {
    const repository: CloudBackupRepository = {
      getBackup: vi.fn().mockRejectedValue(new Error('Invalid cloud backup JSON')),
      saveBackup: vi.fn(),
    }
    await expect(getCloudBackupSummary(repository)).rejects.toThrow(
      'Invalid cloud backup JSON',
    )
  })
})
