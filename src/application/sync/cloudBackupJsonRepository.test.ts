import { describe, expect, it, vi } from 'vitest'
import { defaultSettings } from '../../domain/settings/defaultSettings'
import { CloudBackupJsonRepository } from './cloudBackupJsonRepository'
import type { CloudBackupTextStorage } from './cloudBackupTextStorage'
import type { CloudBackupData } from './syncTypes'

const backup: CloudBackupData = {
  version: 1,
  updatedAt: '2026-06-21T12:00:00.000Z',
  tasks: [],
  scheduledBlocks: [],
  settings: defaultSettings,
  pomodoroSessions: [],
}

const createStorage = (text?: string) => ({
  readText: vi.fn().mockResolvedValue(text),
  writeText: vi.fn().mockResolvedValue(undefined),
}) satisfies CloudBackupTextStorage

describe('CloudBackupJsonRepository', () => {
  it('returns undefined when text storage has no backup', async () => {
    const repository = new CloudBackupJsonRepository(createStorage())
    await expect(repository.getBackup()).resolves.toBeUndefined()
  })

  it('parses valid stored JSON into CloudBackupData', async () => {
    const repository = new CloudBackupJsonRepository(
      createStorage(JSON.stringify(backup)),
    )
    await expect(repository.getBackup()).resolves.toEqual(backup)
  })

  it('rejects invalid stored JSON', async () => {
    const repository = new CloudBackupJsonRepository(createStorage('{invalid'))
    await expect(repository.getBackup()).rejects.toThrow(
      'Invalid cloud backup JSON',
    )
  })

  it('rejects an invalid stored backup shape', async () => {
    const repository = new CloudBackupJsonRepository(
      createStorage(JSON.stringify({ ...backup, tasks: null })),
    )
    await expect(repository.getBackup()).rejects.toThrow(
      'Invalid CloudBackupData',
    )
  })

  it('serializes valid data before writing text storage', async () => {
    const storage = createStorage()
    const repository = new CloudBackupJsonRepository(storage)

    await repository.saveBackup(backup)

    expect(storage.writeText).toHaveBeenCalledOnce()
    expect(JSON.parse(storage.writeText.mock.calls[0][0]) as unknown).toEqual(
      backup,
    )
  })

  it('does not write an invalid backup', async () => {
    const storage = createStorage()
    const repository = new CloudBackupJsonRepository(storage)
    const invalidBackup = {
      ...backup,
      activeTimer: {},
    } as unknown as CloudBackupData

    await expect(repository.saveBackup(invalidBackup)).rejects.toThrow(
      'Invalid CloudBackupData',
    )
    expect(storage.writeText).not.toHaveBeenCalled()
  })

  it.each(['calendarEvents', 'activeTimer'])(
    'rejects stored JSON containing %s',
    async (forbiddenKey) => {
      const repository = new CloudBackupJsonRepository(
        createStorage(JSON.stringify({ ...backup, [forbiddenKey]: [] })),
      )
      await expect(repository.getBackup()).rejects.toThrow(
        'Invalid CloudBackupData',
      )
    },
  )
})
