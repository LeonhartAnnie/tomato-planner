import type { CloudBackupData } from './syncTypes'
import { migrateCloudBackupData } from './migrateCloudBackupData'
import { assertCloudBackupData } from './validateCloudBackupData'

export const serializeCloudBackupData = (data: CloudBackupData): string =>
  JSON.stringify(assertCloudBackupData(data))

export const parseCloudBackupDataJson = (json: string): CloudBackupData => {
  let parsed: unknown
  try {
    parsed = JSON.parse(json) as unknown
  } catch (error: unknown) {
    throw new Error('Invalid cloud backup JSON', { cause: error })
  }

  return assertCloudBackupData(migrateCloudBackupData(parsed))
}
