import { nowIso } from '../../utils/dateTime'
import type { CloudBackupRepository } from './cloudBackupRepository'
import { exportLocalBackup } from './exportLocalBackup'
import type { LocalAppDataRepository } from './localAppDataRepository'
import type { SyncClock } from './syncTypes'
import { assertCloudBackupData } from './validateCloudBackupData'

export interface UploadLocalBackupResult {
  uploadedAt: string
  backupUpdatedAt: string
}

export const uploadLocalBackup = async (
  localRepository: LocalAppDataRepository,
  cloudRepository: CloudBackupRepository,
  clock: SyncClock = nowIso,
): Promise<UploadLocalBackupResult> => {
  const backup = assertCloudBackupData(
    await exportLocalBackup(localRepository),
  )
  await cloudRepository.saveBackup(backup)

  return {
    uploadedAt: clock(),
    backupUpdatedAt: backup.updatedAt,
  }
}
