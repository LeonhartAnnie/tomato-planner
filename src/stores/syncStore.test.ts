import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { GoogleDriveBackupService } from '../infrastructure/sync/createGoogleDriveSyncService'
import { useSyncStore } from './syncStore'

const uploadResult = {
  uploadedAt: '2026-06-21T10:00:00.000Z',
  backupUpdatedAt: '2026-06-21T09:00:00.000Z',
}

const restoreResult = {
  restoredAt: '2026-06-21T11:00:00.000Z',
  backupUpdatedAt: '2026-06-21T10:30:00.000Z',
}

const localSummary = {
  taskCount: 2,
  scheduledBlockCount: 1,
  pomodoroSessionCount: 3,
  hasSettings: true,
  latestDataUpdatedAt: '2026-06-21T09:00:00.000Z',
}

const cloudSummary = {
  ...localSummary,
  taskCount: 4,
  latestDataUpdatedAt: '2026-06-21T10:30:00.000Z',
}

const createService = (): GoogleDriveBackupService => ({
  ensureAuthorized: vi.fn().mockResolvedValue(undefined),
  getLocalBackupSummary: vi.fn().mockResolvedValue(localSummary),
  getCloudBackupSummary: vi.fn().mockResolvedValue(cloudSummary),
  uploadLocalBackup: vi.fn().mockResolvedValue(uploadResult),
  restoreCloudBackup: vi.fn().mockResolvedValue(restoreResult),
})

beforeEach(() => {
  useSyncStore.setState({
    status: 'idle',
    error: undefined,
    lastSyncedAt: undefined,
    lastAction: undefined,
    lastBackupUpdatedAt: undefined,
    localSummary: undefined,
    cloudSummary: undefined,
    summaryStatus: 'idle',
    summaryError: undefined,
  })
})

describe('syncStore backup summaries', () => {
  it('loads a local summary without requesting authorization', async () => {
    const service = createService()

    await expect(
      useSyncStore.getState().loadLocalBackupSummary(service),
    ).resolves.toBe(true)

    expect(service.ensureAuthorized).not.toHaveBeenCalled()
    expect(useSyncStore.getState()).toMatchObject({
      summaryStatus: 'success',
      localSummary,
    })
  })

  it('loads a cloud summary after authorization', async () => {
    const service = createService()

    await expect(
      useSyncStore.getState().loadCloudBackupSummary(service),
    ).resolves.toBe(true)

    expect(service.ensureAuthorized).toHaveBeenCalledOnce()
    expect(service.getCloudBackupSummary).toHaveBeenCalledOnce()
    expect(useSyncStore.getState()).toMatchObject({
      summaryStatus: 'success',
      cloudSummary,
    })
  })

  it('represents a missing cloud backup as a successful empty result', async () => {
    const service = createService()
    vi.mocked(service.getCloudBackupSummary).mockResolvedValue(undefined)
    useSyncStore.setState({ cloudSummary })

    await useSyncStore.getState().loadCloudBackupSummary(service)

    expect(useSyncStore.getState().summaryStatus).toBe('success')
    expect(useSyncStore.getState().cloudSummary).toBeUndefined()
  })

  it('does not read cloud data when authorization fails', async () => {
    const service = createService()
    vi.mocked(service.ensureAuthorized).mockRejectedValue(
      new Error('Authorization denied'),
    )

    await expect(
      useSyncStore.getState().loadCloudBackupSummary(service),
    ).resolves.toBe(false)

    expect(service.getCloudBackupSummary).not.toHaveBeenCalled()
    expect(useSyncStore.getState()).toMatchObject({
      summaryStatus: 'error',
      summaryError: '無法讀取 Google Drive 備份，請稍後再試。',
    })
  })

  it('stores summary read failures without running backup operations', async () => {
    const service = createService()
    vi.mocked(service.getLocalBackupSummary).mockRejectedValue(
      new Error('Local summary failed'),
    )

    await expect(
      useSyncStore.getState().loadLocalBackupSummary(service),
    ).resolves.toBe(false)

    expect(service.uploadLocalBackup).not.toHaveBeenCalled()
    expect(service.restoreCloudBackup).not.toHaveBeenCalled()
    expect(useSyncStore.getState()).toMatchObject({
      summaryStatus: 'error',
      summaryError: '操作失敗，請稍後再試。',
    })
  })
})

describe('syncStore manual backup actions', () => {
  it('starts idle', () => {
    expect(useSyncStore.getState()).toMatchObject({ status: 'idle' })
  })

  it('authorizes and stores a successful upload result', async () => {
    const service = createService()

    await expect(
      useSyncStore.getState().uploadLocalBackup(service),
    ).resolves.toBe(true)

    expect(service.ensureAuthorized).toHaveBeenCalledOnce()
    expect(service.uploadLocalBackup).toHaveBeenCalledOnce()
    expect(service.restoreCloudBackup).not.toHaveBeenCalled()
    expect(useSyncStore.getState()).toMatchObject({
      status: 'success',
      lastAction: 'upload',
      lastSyncedAt: uploadResult.uploadedAt,
      lastBackupUpdatedAt: uploadResult.backupUpdatedAt,
    })
  })

  it('authorizes and stores a successful restore result', async () => {
    const service = createService()

    await expect(
      useSyncStore.getState().restoreCloudBackup(service),
    ).resolves.toBe(true)

    expect(service.ensureAuthorized).toHaveBeenCalledOnce()
    expect(service.restoreCloudBackup).toHaveBeenCalledOnce()
    expect(service.uploadLocalBackup).not.toHaveBeenCalled()
    expect(useSyncStore.getState()).toMatchObject({
      status: 'success',
      lastAction: 'restore',
      lastSyncedAt: restoreResult.restoredAt,
      lastBackupUpdatedAt: restoreResult.backupUpdatedAt,
    })
  })

  it('enters syncing while an upload is pending', async () => {
    let resolveUpload: (result: typeof uploadResult) => void = () => undefined
    const service = createService()
    vi.mocked(service.uploadLocalBackup).mockReturnValue(
      new Promise((resolve) => {
        resolveUpload = resolve
      }),
    )

    const pending = useSyncStore.getState().uploadLocalBackup(service)
    expect(useSyncStore.getState().status).toBe('syncing')

    resolveUpload(uploadResult)
    await pending
  })

  it('does not upload when authorization fails', async () => {
    const service = createService()
    vi.mocked(service.ensureAuthorized).mockRejectedValue(
      new Error('Authorization denied'),
    )

    await expect(
      useSyncStore.getState().uploadLocalBackup(service),
    ).resolves.toBe(false)

    expect(service.uploadLocalBackup).not.toHaveBeenCalled()
    expect(useSyncStore.getState()).toMatchObject({
      status: 'error',
      error: '無法寫入 Google Drive 備份，請確認網路狀態與 Google 授權後再試。',
    })
  })

  it('does not restore when authorization fails', async () => {
    const service = createService()
    vi.mocked(service.ensureAuthorized).mockRejectedValue(
      new Error('Authorization denied'),
    )

    await expect(
      useSyncStore.getState().restoreCloudBackup(service),
    ).resolves.toBe(false)

    expect(service.restoreCloudBackup).not.toHaveBeenCalled()
  })

  it('stores an upload failure without replacing previous success metadata', async () => {
    useSyncStore.setState({
      lastAction: 'restore',
      lastSyncedAt: restoreResult.restoredAt,
      lastBackupUpdatedAt: restoreResult.backupUpdatedAt,
    })
    const service = createService()
    vi.mocked(service.uploadLocalBackup).mockRejectedValue(
      new Error('Upload failed'),
    )

    await useSyncStore.getState().uploadLocalBackup(service)

    expect(useSyncStore.getState()).toMatchObject({
      status: 'error',
      error: '無法寫入 Google Drive 備份，請確認網路狀態與 Google 授權後再試。',
      lastAction: 'restore',
      lastSyncedAt: restoreResult.restoredAt,
      lastBackupUpdatedAt: restoreResult.backupUpdatedAt,
    })
  })

  it('stores a restore failure', async () => {
    const service = createService()
    vi.mocked(service.restoreCloudBackup).mockRejectedValue(
      new Error('Restore failed'),
    )

    await expect(
      useSyncStore.getState().restoreCloudBackup(service),
    ).resolves.toBe(false)

    expect(useSyncStore.getState()).toMatchObject({
      status: 'error',
      error: '無法讀取 Google Drive 備份，請稍後再試。',
    })
  })

  it('resets status and error while preserving the last successful action', () => {
    useSyncStore.setState({
      status: 'error',
      error: 'Temporary failure',
      lastAction: 'upload',
      lastSyncedAt: uploadResult.uploadedAt,
      lastBackupUpdatedAt: uploadResult.backupUpdatedAt,
    })

    useSyncStore.getState().resetSyncState()

    expect(useSyncStore.getState()).toMatchObject({
      status: 'idle',
      lastAction: 'upload',
      lastSyncedAt: uploadResult.uploadedAt,
      lastBackupUpdatedAt: uploadResult.backupUpdatedAt,
    })
    expect(useSyncStore.getState().error).toBeUndefined()
  })
})
