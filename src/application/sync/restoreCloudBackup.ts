import { nowIso } from '../../utils/dateTime'
import type { CloudBackupRepository } from './cloudBackupRepository'
import { importCloudBackup } from './importCloudBackup'
import type { LocalAppDataRepository } from './localAppDataRepository'
import type { SyncClock } from './syncTypes'
import { assertCloudBackupData } from './validateCloudBackupData'

export interface RestoreCloudBackupResult {
  restoredAt: string
  backupUpdatedAt: string
}

export const restoreCloudBackup = async (
  localRepository: LocalAppDataRepository,
  cloudRepository: CloudBackupRepository,
  clock: SyncClock = nowIso,
): Promise<RestoreCloudBackupResult> => {
  const cloudValue = await cloudRepository.getBackup()
  if (cloudValue === undefined) {
    throw new Error('No Google Drive backup found')
  }

  const backup = assertCloudBackupData(cloudValue)
  await importCloudBackup(backup, localRepository)

  return {
    restoredAt: clock(),
    backupUpdatedAt: backup.updatedAt,
  }
}
