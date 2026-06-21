import { nowIso } from '../../utils/dateTime'
import type { CloudBackupRepository } from './cloudBackupRepository'
import { exportLocalBackup } from './exportLocalBackup'
import { importCloudBackup } from './importCloudBackup'
import type { LocalAppDataRepository } from './localAppDataRepository'
import { resolveBackupConflict } from './resolveBackupConflict'
import type { SyncClock, SyncResult } from './syncTypes'
import { assertCloudBackupData } from './validateCloudBackupData'

export interface SyncWithCloudBackupInput {
  localRepository: LocalAppDataRepository
  cloudRepository: CloudBackupRepository
  clock?: SyncClock
}

export const syncWithCloudBackup = async ({
  localRepository,
  cloudRepository,
  clock = nowIso,
}: SyncWithCloudBackupInput): Promise<SyncResult> => {
  const syncedAt = clock()
  const localBackup = assertCloudBackupData(
    await exportLocalBackup(localRepository),
  )
  const cloudValue = await cloudRepository.getBackup()
  const cloudBackup =
    cloudValue === undefined ? undefined : assertCloudBackupData(cloudValue)
  const selectedBackup = resolveBackupConflict(localBackup, cloudBackup)

  if (cloudBackup && selectedBackup === cloudBackup) {
    await importCloudBackup(cloudBackup, localRepository)
    return {
      used: 'cloud',
      syncedAt,
      cloudUpdatedAt: cloudBackup.updatedAt,
    }
  }

  await cloudRepository.saveBackup(localBackup)
  return {
    used: 'local',
    syncedAt,
    cloudUpdatedAt: localBackup.updatedAt,
  }
}
