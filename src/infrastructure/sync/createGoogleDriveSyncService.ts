import type { CloudBackupRepository } from '../../application/sync/cloudBackupRepository'
import { CloudBackupJsonRepository } from '../../application/sync/cloudBackupJsonRepository'
import type { CloudBackupTextStorage } from '../../application/sync/cloudBackupTextStorage'
import type { LocalAppDataRepository } from '../../application/sync/localAppDataRepository'
import {
  restoreCloudBackup,
  type RestoreCloudBackupResult,
} from '../../application/sync/restoreCloudBackup'
import type { SyncClock, SyncResult } from '../../application/sync/syncTypes'
import { syncWithCloudBackup } from '../../application/sync/syncWithCloudBackup'
import {
  uploadLocalBackup,
  type UploadLocalBackupResult,
} from '../../application/sync/uploadLocalBackup'
import { fetchGoogleHttpTransport } from '../google/fetchGoogleHttpTransport'
import {
  googleDriveTokenProvider,
  type GoogleDriveTokenProvider,
} from '../google/googleDriveAuth'
import { GoogleDriveCloudBackupTextStorage } from '../google/googleDriveCloudBackupTextStorage'
import type { GoogleHttpTransport } from '../google/googleHttpTransport'
import { GOOGLE_DRIVE_APPDATA_SCOPE } from '../google/googleDriveTypes'
import { localAppDataDexieRepository } from '../repositories/localAppDataDexieRepository'

export interface GoogleDriveBackupService {
  ensureAuthorized(): Promise<void>
  uploadLocalBackup(): Promise<UploadLocalBackupResult>
  restoreCloudBackup(): Promise<RestoreCloudBackupResult>
}

export interface GoogleDriveSyncService extends GoogleDriveBackupService {
  /**
   * Legacy automatic LWW flow. MVP UI must use explicit upload or restore
   * until app-level revision metadata and deletion tombstones are available.
   */
  syncNow(): Promise<SyncResult>
}

export interface CreateGoogleDriveSyncServiceOptions {
  localRepository?: LocalAppDataRepository
  cloudRepository?: CloudBackupRepository
  cloudTextStorage?: CloudBackupTextStorage
  tokenProvider?: GoogleDriveTokenProvider
  transport?: GoogleHttpTransport
  clock?: SyncClock
}

const createDefaultCloudRepository = (
  options: CreateGoogleDriveSyncServiceOptions,
  tokenProvider: GoogleDriveTokenProvider,
): CloudBackupRepository => {
  const textStorage =
    options.cloudTextStorage ??
    new GoogleDriveCloudBackupTextStorage(
      tokenProvider,
      options.transport ?? fetchGoogleHttpTransport,
    )
  return new CloudBackupJsonRepository(textStorage)
}

export const createGoogleDriveSyncService = (
  options: CreateGoogleDriveSyncServiceOptions = {},
): GoogleDriveSyncService => {
  const tokenProvider = options.tokenProvider ?? googleDriveTokenProvider
  const localRepository =
    options.localRepository ?? localAppDataDexieRepository
  const cloudRepository =
    options.cloudRepository ??
    createDefaultCloudRepository(options, tokenProvider)

  return {
    ensureAuthorized: async () => {
      await tokenProvider.getAccessToken(GOOGLE_DRIVE_APPDATA_SCOPE)
    },
    uploadLocalBackup: () =>
      uploadLocalBackup(
        localRepository,
        cloudRepository,
        options.clock,
      ),
    restoreCloudBackup: () =>
      restoreCloudBackup(
        localRepository,
        cloudRepository,
        options.clock,
      ),
    syncNow: () =>
      syncWithCloudBackup({
        localRepository,
        cloudRepository,
        clock: options.clock,
      }),
  }
}
