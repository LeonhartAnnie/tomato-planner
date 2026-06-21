import type { CloudBackupRepository } from './cloudBackupRepository'
import {
  parseCloudBackupDataJson,
  serializeCloudBackupData,
} from './cloudBackupJsonCodec'
import type { CloudBackupTextStorage } from './cloudBackupTextStorage'
import type { CloudBackupData } from './syncTypes'

export class CloudBackupJsonRepository implements CloudBackupRepository {
  constructor(private readonly storage: CloudBackupTextStorage) {}

  getBackup = async (): Promise<CloudBackupData | undefined> => {
    const text = await this.storage.readText()
    return text === undefined ? undefined : parseCloudBackupDataJson(text)
  }

  saveBackup = async (data: CloudBackupData): Promise<void> => {
    const text = serializeCloudBackupData(data)
    await this.storage.writeText(text)
  }
}
