import { describe, expect, it, vi } from 'vitest'
import { defaultSettings } from '../../domain/settings/defaultSettings'
import type { CloudBackupRepository } from './cloudBackupRepository'
import type { LocalAppDataRepository } from './localAppDataRepository'
import type { CloudBackupData } from './syncTypes'
import { restoreCloudBackup } from './restoreCloudBackup'

const cloudTask = {
  id: 'cloud-task',
  title: 'Cloud task',
  estimatedMinutes: 25,
  splittable: false,
  createdAt: '2026-06-21T08:00:00.000Z',
  updatedAt: '2026-06-21T09:00:00.000Z',
}

const backup: CloudBackupData = {
  version: 1,
  updatedAt: cloudTask.updatedAt,
  tasks: [cloudTask],
  scheduledBlocks: [],
  settings: defaultSettings,
  pomodoroSessions: [],
}

const createLocalRepository = () => ({
  getTasks: vi.fn(),
  saveTasks: vi.fn(),
  getScheduledBlocks: vi.fn(),
  saveScheduledBlocks: vi.fn(),
  getSettings: vi.fn(),
  saveSettings: vi.fn(),
  getPomodoroSessions: vi.fn(),
  savePomodoroSessions: vi.fn(),
  replaceAllAppData: vi.fn().mockResolvedValue(undefined),
  saveCalendarEvents: vi.fn(),
  activeTimer: { id: 'active-timer' },
}) satisfies LocalAppDataRepository & {
  saveCalendarEvents: ReturnType<typeof vi.fn>
  activeTimer: object
}

describe('restoreCloudBackup', () => {
  it('imports an existing cloud backup into local app data', async () => {
    const localRepository = createLocalRepository()
    const cloudRepository: CloudBackupRepository = {
      getBackup: vi.fn().mockResolvedValue(backup),
      saveBackup: vi.fn(),
    }

    const result = await restoreCloudBackup(
      localRepository,
      cloudRepository,
      () => '2026-06-21T10:00:00.000Z',
    )

    expect(result).toEqual({
      restoredAt: '2026-06-21T10:00:00.000Z',
      backupUpdatedAt: backup.updatedAt,
    })
    expect(localRepository.replaceAllAppData).toHaveBeenCalledWith({
      tasks: backup.tasks,
      scheduledBlocks: backup.scheduledBlocks,
      settings: backup.settings,
      pomodoroSessions: backup.pomodoroSessions,
    })
    expect(cloudRepository.saveBackup).not.toHaveBeenCalled()
    expect(localRepository.saveCalendarEvents).not.toHaveBeenCalled()
    expect(localRepository.activeTimer).toEqual({ id: 'active-timer' })
  })

  it('fails clearly when no cloud backup exists', async () => {
    const cloudRepository: CloudBackupRepository = {
      getBackup: vi.fn().mockResolvedValue(undefined),
      saveBackup: vi.fn(),
    }

    await expect(
      restoreCloudBackup(createLocalRepository(), cloudRepository),
    ).rejects.toThrow('No Google Drive backup found')
  })

  it('rejects invalid cloud backup data before writing local data', async () => {
    const localRepository = createLocalRepository()
    const cloudRepository: CloudBackupRepository = {
      getBackup: vi.fn().mockResolvedValue({ ...backup, activeTimer: {} }),
      saveBackup: vi.fn(),
    }

    await expect(
      restoreCloudBackup(localRepository, cloudRepository),
    ).rejects.toThrow('Invalid CloudBackupData')
    expect(localRepository.replaceAllAppData).not.toHaveBeenCalled()
  })
})
