import { create } from 'zustand'
import {
  createGoogleDriveSyncService,
  type GoogleDriveBackupService,
} from '../infrastructure/sync/createGoogleDriveSyncService'

export type SyncStoreStatus = 'idle' | 'syncing' | 'success' | 'error'
export type SyncStoreAction = 'upload' | 'restore'

export interface SyncStoreState {
  status: SyncStoreStatus
  error?: string
  lastSyncedAt?: string
  lastAction?: SyncStoreAction
  lastBackupUpdatedAt?: string
  uploadLocalBackup: (service?: GoogleDriveBackupService) => Promise<boolean>
  restoreCloudBackup: (service?: GoogleDriveBackupService) => Promise<boolean>
  resetSyncState: () => void
}

interface CompletedBackupAction {
  action: SyncStoreAction
  syncedAt: string
  backupUpdatedAt: string
}

const POPUP_BLOCKED_MESSAGE =
  'Google 授權視窗被瀏覽器阻擋。請允許此網站開啟彈出視窗，或直接點擊操作按鈕後重新授權。'

const toSyncErrorMessage = (error: unknown): string => {
  if (!(error instanceof Error)) {
    return 'Backup operation failed'
  }

  return error.message.toLowerCase().includes('failed to open popup window')
    ? POPUP_BLOCKED_MESSAGE
    : error.message
}

export const useSyncStore = create<SyncStoreState>((set) => {
  const runBackupAction = async (
    service: GoogleDriveBackupService,
    operation: () => Promise<CompletedBackupAction>,
  ): Promise<boolean> => {
    set({ status: 'syncing', error: undefined })
    try {
      await service.ensureAuthorized()
      const result = await operation()
      set({
        status: 'success',
        error: undefined,
        lastAction: result.action,
        lastSyncedAt: result.syncedAt,
        lastBackupUpdatedAt: result.backupUpdatedAt,
      })
      return true
    } catch (error: unknown) {
      set({ status: 'error', error: toSyncErrorMessage(error) })
      return false
    }
  }

  return {
    status: 'idle',
    error: undefined,
    lastSyncedAt: undefined,
    lastAction: undefined,
    lastBackupUpdatedAt: undefined,

    uploadLocalBackup: (service = createGoogleDriveSyncService()) =>
      runBackupAction(service, async () => {
        const result = await service.uploadLocalBackup()
        return {
          action: 'upload',
          syncedAt: result.uploadedAt,
          backupUpdatedAt: result.backupUpdatedAt,
        }
      }),

    restoreCloudBackup: (service = createGoogleDriveSyncService()) =>
      runBackupAction(service, async () => {
        const result = await service.restoreCloudBackup()
        return {
          action: 'restore',
          syncedAt: result.restoredAt,
          backupUpdatedAt: result.backupUpdatedAt,
        }
      }),

    resetSyncState: () => set({ status: 'idle', error: undefined }),
  }
})
