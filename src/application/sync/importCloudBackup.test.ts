import { describe, expect, it, vi } from 'vitest'
import { defaultSettings } from '../../domain/settings/defaultSettings'
import type { CloudBackupData } from './syncTypes'
import type { LocalAppDataRepository } from './localAppDataRepository'
import { importCloudBackup } from './importCloudBackup'

const backup: CloudBackupData = {
  version: 1,
  updatedAt: '2026-06-21T12:00:00.000Z',
  tasks: [],
  scheduledBlocks: [],
  settings: defaultSettings,
  pomodoroSessions: [],
}

const createRepository = () => ({
  getTasks: vi.fn().mockResolvedValue([]),
  saveTasks: vi.fn().mockResolvedValue(undefined),
  getScheduledBlocks: vi.fn().mockResolvedValue([]),
  saveScheduledBlocks: vi.fn().mockResolvedValue(undefined),
  getSettings: vi.fn().mockResolvedValue(defaultSettings),
  saveSettings: vi.fn().mockResolvedValue(undefined),
  getPomodoroSessions: vi.fn().mockResolvedValue([]),
  savePomodoroSessions: vi.fn().mockResolvedValue(undefined),
  saveCalendarEvents: vi.fn().mockResolvedValue(undefined),
}) satisfies LocalAppDataRepository & { saveCalendarEvents: ReturnType<typeof vi.fn> }

describe('importCloudBackup', () => {
  it('imports every supported app-owned collection without calendar events', async () => {
    const repository = createRepository()

    await importCloudBackup(backup, repository)

    expect(repository.saveTasks).toHaveBeenCalledWith(backup.tasks)
    expect(repository.saveScheduledBlocks).toHaveBeenCalledWith(
      backup.scheduledBlocks,
    )
    expect(repository.saveSettings).toHaveBeenCalledWith(backup.settings)
    expect(repository.savePomodoroSessions).toHaveBeenCalledWith(
      backup.pomodoroSessions,
    )
    expect(repository.saveCalendarEvents).not.toHaveBeenCalled()
  })

  it('rejects an unsupported backup version before writing local data', async () => {
    const repository = createRepository()
    const unsupportedBackup = {
      ...backup,
      version: 2,
    } as unknown as CloudBackupData

    await expect(
      importCloudBackup(unsupportedBackup, repository),
    ).rejects.toThrow('Unsupported cloud backup version: 2')
    expect(repository.saveTasks).not.toHaveBeenCalled()
    expect(repository.saveScheduledBlocks).not.toHaveBeenCalled()
    expect(repository.saveSettings).not.toHaveBeenCalled()
    expect(repository.savePomodoroSessions).not.toHaveBeenCalled()
  })

  it('prefers atomic replacement when the repository supports it', async () => {
    const repository = {
      ...createRepository(),
      replaceAllAppData: vi.fn().mockResolvedValue(undefined),
    }

    await importCloudBackup(backup, repository)

    expect(repository.replaceAllAppData).toHaveBeenCalledWith({
      tasks: backup.tasks,
      scheduledBlocks: backup.scheduledBlocks,
      settings: backup.settings,
      pomodoroSessions: backup.pomodoroSessions,
    })
    expect(repository.saveTasks).not.toHaveBeenCalled()
  })

  it('rejects invalid backup data before calling any local write method', async () => {
    const repository = {
      ...createRepository(),
      replaceAllAppData: vi.fn().mockResolvedValue(undefined),
    }

    await expect(
      importCloudBackup({ ...backup, activeTimer: {} }, repository),
    ).rejects.toThrow('Invalid CloudBackupData')
    expect(repository.replaceAllAppData).not.toHaveBeenCalled()
    expect(repository.saveTasks).not.toHaveBeenCalled()
    expect(repository.saveScheduledBlocks).not.toHaveBeenCalled()
    expect(repository.saveSettings).not.toHaveBeenCalled()
    expect(repository.savePomodoroSessions).not.toHaveBeenCalled()
  })
})
