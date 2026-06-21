import { describe, expect, it, vi } from 'vitest'
import { defaultSettings } from '../../domain/settings/defaultSettings'
import type { CloudBackupRepository } from './cloudBackupRepository'
import type { LocalAppDataRepository } from './localAppDataRepository'
import type { CloudBackupData } from './syncTypes'
import { syncWithCloudBackup } from './syncWithCloudBackup'

const syncTime = '2026-06-21T10:00:00.000Z'
const epoch = '1970-01-01T00:00:00.000Z'

const localTask = {
  id: 'local-task',
  title: 'Local task',
  estimatedMinutes: 25,
  splittable: false,
  createdAt: '2026-06-21T08:00:00.000Z',
  updatedAt: '2026-06-21T09:30:00.000Z',
}

const createBackup = (updatedAt: string): CloudBackupData => ({
  version: 1,
  updatedAt,
  tasks: [],
  scheduledBlocks: [],
  settings: defaultSettings,
  pomodoroSessions: [],
})

const createLocalRepository = (tasks = [] as typeof localTask[]) => ({
  getTasks: vi.fn().mockResolvedValue(tasks),
  saveTasks: vi.fn().mockResolvedValue(undefined),
  getScheduledBlocks: vi.fn().mockResolvedValue([]),
  saveScheduledBlocks: vi.fn().mockResolvedValue(undefined),
  getSettings: vi.fn().mockResolvedValue(defaultSettings),
  saveSettings: vi.fn().mockResolvedValue(undefined),
  getPomodoroSessions: vi.fn().mockResolvedValue([]),
  savePomodoroSessions: vi.fn().mockResolvedValue(undefined),
  saveCalendarEvents: vi.fn().mockResolvedValue(undefined),
}) satisfies LocalAppDataRepository & { saveCalendarEvents: ReturnType<typeof vi.fn> }

const createCloudRepository = (
  backup?: CloudBackupData,
): CloudBackupRepository => ({
  getBackup: vi.fn().mockResolvedValue(backup),
  saveBackup: vi.fn().mockResolvedValue(undefined),
})

describe('syncWithCloudBackup', () => {
  it('uploads local data when no cloud backup exists', async () => {
    const localRepository = createLocalRepository()
    const cloudRepository = createCloudRepository()

    const result = await syncWithCloudBackup({
      localRepository,
      cloudRepository,
      clock: () => syncTime,
    })

    expect(result).toEqual({
      used: 'local',
      syncedAt: syncTime,
      cloudUpdatedAt: epoch,
    })
    expect(cloudRepository.saveBackup).toHaveBeenCalledWith(
      expect.objectContaining({ version: 1, updatedAt: epoch }),
    )
    const savedBackup = vi.mocked(cloudRepository.saveBackup).mock.calls[0][0]
    expect(savedBackup).not.toHaveProperty('calendarEvents')
    expect(savedBackup).not.toHaveProperty('activeTimer')
    expect(localRepository.saveCalendarEvents).not.toHaveBeenCalled()
  })

  it('imports cloud data when cloud is newer even if the sync clock is later', async () => {
    const localRepository = createLocalRepository()
    const cloudBackup = createBackup('2026-06-21T11:00:00.000Z')
    const cloudRepository = createCloudRepository(cloudBackup)

    const result = await syncWithCloudBackup({
      localRepository,
      cloudRepository,
      clock: () => syncTime,
    })

    expect(result.used).toBe('cloud')
    expect(localRepository.saveSettings).toHaveBeenCalledWith(
      cloudBackup.settings,
    )
    expect(cloudRepository.saveBackup).not.toHaveBeenCalled()
  })

  it('uploads local data when local is newer', async () => {
    const localRepository = createLocalRepository([localTask])
    const cloudRepository = createCloudRepository(
      createBackup('2026-06-21T09:00:00.000Z'),
    )

    const result = await syncWithCloudBackup({
      localRepository,
      cloudRepository,
      clock: () => syncTime,
    })

    expect(result.used).toBe('local')
    expect(cloudRepository.saveBackup).toHaveBeenCalledOnce()
    expect(localRepository.saveTasks).not.toHaveBeenCalled()
  })

  it('does not let an empty device overwrite a newer cloud backup', async () => {
    const localRepository = createLocalRepository()
    const cloudBackup = {
      ...createBackup('2026-06-21T09:00:00.000Z'),
      tasks: [localTask],
    }
    const cloudRepository = createCloudRepository(cloudBackup)

    const result = await syncWithCloudBackup({
      localRepository,
      cloudRepository,
      clock: () => '2026-06-21T12:00:00.000Z',
    })

    expect(result).toMatchObject({
      used: 'cloud',
      syncedAt: '2026-06-21T12:00:00.000Z',
      cloudUpdatedAt: cloudBackup.updatedAt,
    })
    expect(localRepository.saveTasks).toHaveBeenCalledWith([localTask])
    expect(cloudRepository.saveBackup).not.toHaveBeenCalled()
  })

  it('propagates cloud repository failures', async () => {
    const localRepository = createLocalRepository()
    const cloudRepository: CloudBackupRepository = {
      getBackup: vi.fn().mockRejectedValue(new Error('Cloud unavailable')),
      saveBackup: vi.fn(),
    }

    await expect(
      syncWithCloudBackup({
        localRepository,
        cloudRepository,
        clock: () => syncTime,
      }),
    ).rejects.toThrow('Cloud unavailable')
  })

  it('propagates local repository failures', async () => {
    const localRepository = createLocalRepository()
    localRepository.getTasks.mockRejectedValue(new Error('Local read failed'))
    const cloudRepository = createCloudRepository()

    await expect(
      syncWithCloudBackup({
        localRepository,
        cloudRepository,
        clock: () => syncTime,
      }),
    ).rejects.toThrow('Local read failed')
    expect(cloudRepository.getBackup).not.toHaveBeenCalled()
  })

  it('rejects invalid cloud data before importing it locally', async () => {
    const localRepository = createLocalRepository()
    const invalidCloudBackup = {
      ...createBackup('2026-06-21T11:00:00.000Z'),
      calendarEvents: [],
    } as unknown as CloudBackupData
    const cloudRepository = createCloudRepository(invalidCloudBackup)

    await expect(
      syncWithCloudBackup({
        localRepository,
        cloudRepository,
        clock: () => syncTime,
      }),
    ).rejects.toThrow('Invalid CloudBackupData')
    expect(localRepository.saveTasks).not.toHaveBeenCalled()
    expect(localRepository.saveScheduledBlocks).not.toHaveBeenCalled()
    expect(localRepository.saveSettings).not.toHaveBeenCalled()
    expect(localRepository.savePomodoroSessions).not.toHaveBeenCalled()
    expect(cloudRepository.saveBackup).not.toHaveBeenCalled()
  })

  it('validates locally exported data before reading cloud backup', async () => {
    const localRepository = createLocalRepository()
    localRepository.getTasks.mockResolvedValue([
      { id: 'invalid-task' },
    ] as unknown as Awaited<ReturnType<LocalAppDataRepository['getTasks']>>)
    const cloudRepository = createCloudRepository()

    await expect(
      syncWithCloudBackup({
        localRepository,
        cloudRepository,
        clock: () => syncTime,
      }),
    ).rejects.toThrow('Invalid app data timestamp: undefined')
    expect(cloudRepository.getBackup).not.toHaveBeenCalled()
  })
})
