import { describe, expect, it, vi } from 'vitest'
import type {
  LocalAppDataRepository,
  LocalAppDataSnapshot,
} from '../../application/sync/localAppDataRepository'
import { serializeCloudBackupData } from '../../application/sync/cloudBackupJsonCodec'
import type { CloudBackupData } from '../../application/sync/syncTypes'
import { defaultSettings } from '../../domain/settings/defaultSettings'
import { InMemoryCloudBackupTextStorage } from '../repositories/inMemoryCloudBackupTextStorage'
import type { GoogleDriveTokenProvider } from '../google/googleDriveAuth'
import { GOOGLE_DRIVE_APPDATA_SCOPE } from '../google/googleDriveTypes'
import { createGoogleDriveSyncService } from './createGoogleDriveSyncService'

const syncTime = '2026-06-21T10:00:00.000Z'

const localTask = {
  id: 'local-task',
  title: 'Local task',
  estimatedMinutes: 25,
  splittable: false,
  createdAt: '2026-06-21T08:00:00.000Z',
  updatedAt: '2026-06-21T09:00:00.000Z',
}

const cloudTask = {
  ...localTask,
  id: 'cloud-task',
  title: 'Cloud task',
  updatedAt: '2026-06-21T11:00:00.000Z',
}

class TestLocalAppDataRepository implements LocalAppDataRepository {
  tasks = [structuredClone(localTask)]
  scheduledBlocks: LocalAppDataSnapshot['scheduledBlocks'] = []
  settings = structuredClone(defaultSettings)
  pomodoroSessions: LocalAppDataSnapshot['pomodoroSessions'] = []
  readonly calendarEvents = [{ id: 'external-calendar-event' }]
  readonly activeTimer = { id: 'active-timer' }
  replaceAllCallCount = 0

  getTasks = async () => structuredClone(this.tasks)
  saveTasks = async (tasks: LocalAppDataSnapshot['tasks']) => {
    this.tasks = structuredClone(tasks)
  }
  getScheduledBlocks = async () => structuredClone(this.scheduledBlocks)
  saveScheduledBlocks = async (
    blocks: LocalAppDataSnapshot['scheduledBlocks'],
  ) => {
    this.scheduledBlocks = structuredClone(blocks)
  }
  getSettings = async () => structuredClone(this.settings)
  saveSettings = async (settings: LocalAppDataSnapshot['settings']) => {
    this.settings = structuredClone(settings)
  }
  getPomodoroSessions = async () => structuredClone(this.pomodoroSessions)
  savePomodoroSessions = async (
    sessions: LocalAppDataSnapshot['pomodoroSessions'],
  ) => {
    this.pomodoroSessions = structuredClone(sessions)
  }
  replaceAllAppData = async (data: LocalAppDataSnapshot) => {
    this.replaceAllCallCount += 1
    this.tasks = structuredClone(data.tasks)
    this.scheduledBlocks = structuredClone(data.scheduledBlocks)
    this.settings = structuredClone(data.settings)
    this.pomodoroSessions = structuredClone(data.pomodoroSessions)
  }
}

const createCloudBackup = (
  updatedAt: string,
  tasks = [cloudTask],
): CloudBackupData => ({
  version: 1,
  updatedAt,
  tasks,
  scheduledBlocks: [],
  settings: defaultSettings,
  pomodoroSessions: [],
})

const createService = (
  localRepository: LocalAppDataRepository,
  cloudTextStorage: InMemoryCloudBackupTextStorage,
) =>
  createGoogleDriveSyncService({
    localRepository,
    cloudTextStorage,
    clock: () => syncTime,
  })

describe('createGoogleDriveSyncService', () => {
  it('authorizes only the Drive appData scope without running synchronization', async () => {
    const getAccessToken = vi.fn().mockResolvedValue('drive-token')
    const tokenProvider: GoogleDriveTokenProvider = { getAccessToken }
    const localRepository = new TestLocalAppDataRepository()
    const cloudTextStorage = new InMemoryCloudBackupTextStorage()
    const service = createGoogleDriveSyncService({
      localRepository,
      cloudTextStorage,
      tokenProvider,
      clock: () => syncTime,
    })

    await service.ensureAuthorized()

    expect(getAccessToken).toHaveBeenCalledWith(GOOGLE_DRIVE_APPDATA_SCOPE)
    expect(cloudTextStorage.getStoredText()).toBeUndefined()
    expect(localRepository.replaceAllCallCount).toBe(0)
  })

  it('reads a local backup summary without requesting Google authorization', async () => {
    const getAccessToken = vi.fn().mockResolvedValue('drive-token')
    const service = createGoogleDriveSyncService({
      localRepository: new TestLocalAppDataRepository(),
      cloudTextStorage: new InMemoryCloudBackupTextStorage(),
      tokenProvider: { getAccessToken },
    })

    await expect(service.getLocalBackupSummary()).resolves.toMatchObject({
      taskCount: 1,
      latestDataUpdatedAt: localTask.updatedAt,
    })
    expect(getAccessToken).not.toHaveBeenCalled()
  })

  it('reads an existing cloud backup summary through the JSON repository', async () => {
    const cloudBackup = createCloudBackup('2026-06-21T11:00:00.000Z')
    const service = createService(
      new TestLocalAppDataRepository(),
      new InMemoryCloudBackupTextStorage(serializeCloudBackupData(cloudBackup)),
    )

    await expect(service.getCloudBackupSummary()).resolves.toEqual({
      taskCount: 1,
      scheduledBlockCount: 0,
      pomodoroSessionCount: 0,
      hasSettings: true,
      latestDataUpdatedAt: cloudBackup.updatedAt,
    })
  })

  it('returns undefined when cloud backup text does not exist', async () => {
    const service = createService(
      new TestLocalAppDataRepository(),
      new InMemoryCloudBackupTextStorage(),
    )
    await expect(service.getCloudBackupSummary()).resolves.toBeUndefined()
  })

  it('writes local backup JSON when cloud text does not exist', async () => {
    const localRepository = new TestLocalAppDataRepository()
    const cloudTextStorage = new InMemoryCloudBackupTextStorage()

    const result = await createService(
      localRepository,
      cloudTextStorage,
    ).syncNow()

    expect(result.used).toBe('local')
    expect(JSON.parse(cloudTextStorage.getStoredText() ?? '')).toMatchObject({
      updatedAt: localTask.updatedAt,
      tasks: [localTask],
    })
  })

  it('explicitly uploads local data and overwrites existing cloud text', async () => {
    const localRepository = new TestLocalAppDataRepository()
    const cloudTextStorage = new InMemoryCloudBackupTextStorage(
      serializeCloudBackupData(
        createCloudBackup('2099-06-21T11:00:00.000Z'),
      ),
    )

    const result = await createService(
      localRepository,
      cloudTextStorage,
    ).uploadLocalBackup()

    expect(result).toEqual({
      uploadedAt: syncTime,
      backupUpdatedAt: localTask.updatedAt,
    })
    expect(JSON.parse(cloudTextStorage.getStoredText() ?? '')).toMatchObject({
      tasks: [localTask],
      updatedAt: localTask.updatedAt,
    })
  })

  it('explicitly restores cloud data into the local repository', async () => {
    const localRepository = new TestLocalAppDataRepository()
    const cloudBackup = createCloudBackup(
      '2026-06-21T11:00:00.000Z',
    )
    const cloudTextStorage = new InMemoryCloudBackupTextStorage(
      serializeCloudBackupData(cloudBackup),
    )

    const result = await createService(
      localRepository,
      cloudTextStorage,
    ).restoreCloudBackup()

    expect(result).toEqual({
      restoredAt: syncTime,
      backupUpdatedAt: cloudBackup.updatedAt,
    })
    expect(localRepository.tasks).toEqual([cloudTask])
    expect(localRepository.replaceAllCallCount).toBe(1)
  })

  it('fails explicit restore when cloud text does not exist', async () => {
    const service = createService(
      new TestLocalAppDataRepository(),
      new InMemoryCloudBackupTextStorage(),
    )

    await expect(service.restoreCloudBackup()).rejects.toThrow(
      'No Google Drive backup found',
    )
  })

  it('imports a newer cloud JSON backup into local repository', async () => {
    const localRepository = new TestLocalAppDataRepository()
    const cloudTextStorage = new InMemoryCloudBackupTextStorage(
      serializeCloudBackupData(
        createCloudBackup('2026-06-21T11:00:00.000Z'),
      ),
    )

    const result = await createService(
      localRepository,
      cloudTextStorage,
    ).syncNow()

    expect(result.used).toBe('cloud')
    expect(localRepository.tasks).toEqual([cloudTask])
    expect(localRepository.replaceAllCallCount).toBe(1)
  })

  it('overwrites older cloud text with newer local data', async () => {
    const localRepository = new TestLocalAppDataRepository()
    const cloudTextStorage = new InMemoryCloudBackupTextStorage(
      serializeCloudBackupData(
        createCloudBackup('2026-06-21T09:00:00.000Z'),
      ),
    )

    const result = await createService(
      localRepository,
      cloudTextStorage,
    ).syncNow()

    expect(result.used).toBe('local')
    expect(JSON.parse(cloudTextStorage.getStoredText() ?? '')).toMatchObject({
      updatedAt: localTask.updatedAt,
      tasks: [localTask],
    })
  })

  it('imports device A data into an empty device B despite a later B sync time', async () => {
    const cloudTextStorage = new InMemoryCloudBackupTextStorage()
    const deviceA = new TestLocalAppDataRepository()
    const deviceB = new TestLocalAppDataRepository()
    deviceB.tasks = []

    await createGoogleDriveSyncService({
      localRepository: deviceA,
      cloudTextStorage,
      clock: () => '2026-06-21T10:00:00.000Z',
    }).syncNow()
    const result = await createGoogleDriveSyncService({
      localRepository: deviceB,
      cloudTextStorage,
      clock: () => '2026-06-21T12:00:00.000Z',
    }).syncNow()

    expect(result.used).toBe('cloud')
    expect(deviceB.tasks).toEqual([localTask])
    expect(deviceB.replaceAllCallCount).toBe(1)
  })

  it('rejects invalid cloud JSON without importing local data', async () => {
    const localRepository = new TestLocalAppDataRepository()
    const cloudTextStorage = new InMemoryCloudBackupTextStorage('{invalid')

    await expect(
      createService(localRepository, cloudTextStorage).syncNow(),
    ).rejects.toThrow('Invalid cloud backup JSON')
    expect(localRepository.tasks).toEqual([localTask])
    expect(localRepository.replaceAllCallCount).toBe(0)
  })

  it('does not synchronize CalendarEvent or active timer state', async () => {
    const localRepository = new TestLocalAppDataRepository()
    const cloudTextStorage = new InMemoryCloudBackupTextStorage()

    await createService(localRepository, cloudTextStorage).syncNow()

    const storedBackup = JSON.parse(
      cloudTextStorage.getStoredText() ?? '',
    ) as Record<string, unknown>
    expect(storedBackup).not.toHaveProperty('calendarEvents')
    expect(storedBackup).not.toHaveProperty('activeTimer')
    expect(localRepository.calendarEvents).toEqual([
      { id: 'external-calendar-event' },
    ])
    expect(localRepository.activeTimer).toEqual({ id: 'active-timer' })
  })
})
