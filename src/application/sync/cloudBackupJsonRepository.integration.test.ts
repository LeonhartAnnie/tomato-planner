import { describe, expect, it } from 'vitest'
import { defaultSettings } from '../../domain/settings/defaultSettings'
import { InMemoryCloudBackupTextStorage } from '../../infrastructure/repositories/inMemoryCloudBackupTextStorage'
import { CloudBackupJsonRepository } from './cloudBackupJsonRepository'
import type { CloudBackupData } from './syncTypes'

const createBackup = (): CloudBackupData => ({
  version: 1,
  updatedAt: '2026-06-21T12:00:00.000Z',
  tasks: [
    {
      id: 'task-1',
      title: 'Stored task',
      estimatedMinutes: 25,
      splittable: false,
      createdAt: '2026-06-21T10:00:00.000Z',
      updatedAt: '2026-06-21T10:00:00.000Z',
    },
  ],
  scheduledBlocks: [],
  settings: defaultSettings,
  pomodoroSessions: [],
})

describe('CloudBackupJsonRepository text-storage integration', () => {
  it('round-trips CloudBackupData through in-memory text storage', async () => {
    const backup = createBackup()
    const storage = new InMemoryCloudBackupTextStorage()
    const repository = new CloudBackupJsonRepository(storage)

    await repository.saveBackup(backup)

    await expect(repository.getBackup()).resolves.toEqual(backup)
  })

  it('rejects invalid text stored by the underlying storage', async () => {
    const storage = new InMemoryCloudBackupTextStorage('{invalid')
    const repository = new CloudBackupJsonRepository(storage)

    await expect(repository.getBackup()).rejects.toThrow(
      'Invalid cloud backup JSON',
    )
  })

  it('stores an immutable JSON string snapshot rather than an object reference', async () => {
    const backup = createBackup()
    const storage = new InMemoryCloudBackupTextStorage()
    const repository = new CloudBackupJsonRepository(storage)
    await repository.saveBackup(backup)

    const storedText = storage.getStoredText()
    backup.tasks[0].title = 'Changed after save'

    expect(typeof storedText).toBe('string')
    expect(storedText).toContain('Stored task')
    await expect(repository.getBackup()).resolves.toMatchObject({
      tasks: [expect.objectContaining({ title: 'Stored task' })],
    })
  })

  it('does not store CalendarEvent or active timer state', async () => {
    const storage = new InMemoryCloudBackupTextStorage()
    const repository = new CloudBackupJsonRepository(storage)

    await repository.saveBackup(createBackup())

    const storedValue = JSON.parse(storage.getStoredText() ?? '') as Record<
      string,
      unknown
    >
    expect(storedValue).not.toHaveProperty('calendarEvents')
    expect(storedValue).not.toHaveProperty('activeTimer')
  })
})
