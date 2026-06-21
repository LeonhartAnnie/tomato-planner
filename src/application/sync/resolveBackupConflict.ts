import type { CloudBackupData } from './syncTypes'

const toUpdatedAtTimestamp = (backup: CloudBackupData): number => {
  const timestamp = new Date(backup.updatedAt).getTime()
  if (!Number.isFinite(timestamp)) {
    throw new Error(`Invalid backup updatedAt: ${backup.updatedAt}`)
  }
  return timestamp
}

export const resolveBackupConflict = (
  localBackup: CloudBackupData,
  cloudBackup?: CloudBackupData,
): CloudBackupData => {
  const localUpdatedAt = toUpdatedAtTimestamp(localBackup)
  if (!cloudBackup) {
    return localBackup
  }

  const cloudUpdatedAt = toUpdatedAtTimestamp(cloudBackup)
  return cloudUpdatedAt > localUpdatedAt ? cloudBackup : localBackup
}
