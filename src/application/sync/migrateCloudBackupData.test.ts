import { describe, expect, it } from 'vitest'
import { migrateCloudBackupData } from './migrateCloudBackupData'

describe('migrateCloudBackupData', () => {
  it('returns a version 1 value unchanged', () => {
    const value = { version: 1, payload: 'untouched' }
    expect(migrateCloudBackupData(value)).toBe(value)
  })

  it('rejects an object without version', () => {
    expect(() => migrateCloudBackupData({})).toThrow(
      'Cloud backup version is missing',
    )
  })

  it('rejects a future version', () => {
    expect(() => migrateCloudBackupData({ version: 2 })).toThrow(
      'Unsupported cloud backup version: 2',
    )
  })

  it('rejects a non-number version', () => {
    expect(() => migrateCloudBackupData({ version: '1' })).toThrow(
      'Cloud backup version must be a finite number',
    )
  })

  it.each([null, undefined, true, 1, 'backup', []])(
    'rejects null, primitives, and arrays',
    (value) => {
      expect(() => migrateCloudBackupData(value)).toThrow(
        'Cloud backup must be an object',
      )
    },
  )
})
