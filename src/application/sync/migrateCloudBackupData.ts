const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

export const migrateCloudBackupData = (value: unknown): unknown => {
  if (!isRecord(value)) {
    throw new Error('Cloud backup must be an object')
  }
  if (!Object.hasOwn(value, 'version')) {
    throw new Error('Cloud backup version is missing')
  }
  if (typeof value.version !== 'number' || !Number.isFinite(value.version)) {
    throw new Error('Cloud backup version must be a finite number')
  }
  if (value.version === 1) {
    return value
  }
  throw new Error(`Unsupported cloud backup version: ${value.version}`)
}
