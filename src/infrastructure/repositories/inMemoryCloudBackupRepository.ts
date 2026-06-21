import type { CloudBackupRepository } from '../../application/sync/cloudBackupRepository'
import type { CloudBackupData } from '../../application/sync/syncTypes'

export class InMemoryCloudBackupRepository
  implements CloudBackupRepository
{
  private backup?: CloudBackupData

  constructor(initialBackup?: CloudBackupData) {
    this.backup = initialBackup ? structuredClone(initialBackup) : undefined
  }

  getBackup = async (): Promise<CloudBackupData | undefined> =>
    this.backup ? structuredClone(this.backup) : undefined

  saveBackup = async (data: CloudBackupData): Promise<void> => {
    this.backup = structuredClone(data)
  }
}
