import 'fake-indexeddb/auto'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { db } from '../../db'
import { defaultSettings } from '../../domain/settings/defaultSettings'
import { InMemoryCloudBackupRepository } from '../../infrastructure/repositories/inMemoryCloudBackupRepository'
import { localAppDataDexieRepository } from '../../infrastructure/repositories/localAppDataDexieRepository'
import type { CalendarEvent, Task } from '../../types'
import type { CloudBackupData } from './syncTypes'
import { syncWithCloudBackup } from './syncWithCloudBackup'

const syncTime = '2026-06-21T10:00:00.000Z'

const localTask: Task = {
  id: 'local-task',
  title: 'Local task',
  estimatedMinutes: 25,
  splittable: false,
  createdAt: '2026-06-21T08:00:00.000Z',
  updatedAt: '2026-06-21T09:00:00.000Z',
}

const cloudTask: Task = {
  ...localTask,
  id: 'cloud-task',
  title: 'Cloud task',
  updatedAt: '2026-06-21T11:00:00.000Z',
}

const calendarEvent: CalendarEvent = {
  id: 'external-event',
  title: 'External event',
  start: '2026-06-21T12:00:00.000Z',
  end: '2026-06-21T13:00:00.000Z',
  source: 'google_calendar',
  readonly: true,
}

const createCloudBackup = (
  updatedAt: string,
  tasks: Task[],
): CloudBackupData => ({
  version: 1,
  updatedAt,
  tasks,
  scheduledBlocks: [],
  settings: defaultSettings,
  pomodoroSessions: [],
})

beforeEach(async () => {
  await Promise.all([
    db.tasks.clear(),
    db.scheduledBlocks.clear(),
    db.calendarEvents.clear(),
    db.pomodoroSessions.clear(),
    db.settings.clear(),
  ])
})

afterAll(async () => {
  await db.delete()
})

describe('syncWithCloudBackup infrastructure integration', () => {
  it('stores local data in fake cloud when no cloud backup exists', async () => {
    await db.tasks.put(localTask)
    const cloudRepository = new InMemoryCloudBackupRepository()

    const result = await syncWithCloudBackup({
      localRepository: localAppDataDexieRepository,
      cloudRepository,
      clock: () => syncTime,
    })

    expect(result.used).toBe('local')
    await expect(cloudRepository.getBackup()).resolves.toMatchObject({
      updatedAt: localTask.updatedAt,
      tasks: [localTask],
    })
  })

  it('imports a newer fake cloud backup into Dexie', async () => {
    await db.tasks.put(localTask)
    const cloudBackup = createCloudBackup(
      '2026-06-21T11:00:00.000Z',
      [cloudTask],
    )
    const cloudRepository = new InMemoryCloudBackupRepository(cloudBackup)

    const result = await syncWithCloudBackup({
      localRepository: localAppDataDexieRepository,
      cloudRepository,
      clock: () => syncTime,
    })

    expect(result.used).toBe('cloud')
    await expect(localAppDataDexieRepository.getTasks()).resolves.toEqual([
      cloudTask,
    ])
  })

  it('overwrites an older fake cloud backup with local data', async () => {
    await db.tasks.put(localTask)
    const cloudRepository = new InMemoryCloudBackupRepository(
      createCloudBackup('2026-06-21T09:00:00.000Z', [cloudTask]),
    )

    const result = await syncWithCloudBackup({
      localRepository: localAppDataDexieRepository,
      cloudRepository,
      clock: () => syncTime,
    })

    expect(result.used).toBe('local')
    await expect(cloudRepository.getBackup()).resolves.toMatchObject({
      updatedAt: localTask.updatedAt,
      tasks: [localTask],
    })
  })

  it('excludes CalendarEvent and active timer state from sync', async () => {
    await db.tasks.put(localTask)
    await db.calendarEvents.put(calendarEvent)
    const cloudRepository = new InMemoryCloudBackupRepository()

    await syncWithCloudBackup({
      localRepository: localAppDataDexieRepository,
      cloudRepository,
      clock: () => syncTime,
    })

    const backup = await cloudRepository.getBackup()
    expect(backup).not.toHaveProperty('calendarEvents')
    expect(backup).not.toHaveProperty('activeTimer')
    await expect(db.calendarEvents.toArray()).resolves.toEqual([calendarEvent])
  })
})
