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

const createService = (): GoogleDriveBackupService => ({
  ensureAuthorized: vi.fn().mockResolvedValue(undefined),
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
      error: 'Authorization denied',
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
      error: 'Upload failed',
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
      error: 'Restore failed',
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
