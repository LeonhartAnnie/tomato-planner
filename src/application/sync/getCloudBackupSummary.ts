import type { BackupSummary } from './backupSummary'
import type { CloudBackupRepository } from './cloudBackupRepository'
import { assertCloudBackupData } from './validateCloudBackupData'

export const getCloudBackupSummary = async (
  repository: CloudBackupRepository,
): Promise<BackupSummary | undefined> => {
  const value = await repository.getBackup()
  if (value === undefined) {
    return undefined
  }

  const backup = assertCloudBackupData(value)
  return {
    taskCount: backup.tasks.length,
    scheduledBlockCount: backup.scheduledBlocks.length,
    pomodoroSessionCount: backup.pomodoroSessions.length,
    hasSettings: backup.settings !== undefined,
    latestDataUpdatedAt: backup.updatedAt,
  }
}
