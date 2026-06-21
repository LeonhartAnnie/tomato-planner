import type { CloudBackupData } from './syncTypes'

export interface CloudBackupRepository {
  getBackup(): Promise<CloudBackupData | undefined>
  saveBackup(data: CloudBackupData): Promise<void>
}
