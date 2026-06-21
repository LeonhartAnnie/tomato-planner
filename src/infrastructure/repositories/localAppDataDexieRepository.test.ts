import 'fake-indexeddb/auto'
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '../../db'
import { defaultSettings } from '../../domain/settings/defaultSettings'
import type {
  CalendarEvent,
  PomodoroSession,
  ScheduledBlock,
  Settings,
  Task,
} from '../../types'
import { localAppDataDexieRepository } from './localAppDataDexieRepository'

const task: Task = {
  id: 'task-1',
  title: 'Dexie task',
  estimatedMinutes: 25,
  splittable: false,
  createdAt: '2026-06-21T00:00:00.000Z',
  updatedAt: '2026-06-21T00:00:00.000Z',
}

const block: ScheduledBlock = {
  id: 'block-1',
  taskId: task.id,
  title: task.title,
  start: '2026-06-21T01:00:00.000Z',
  end: '2026-06-21T01:25:00.000Z',
  source: 'manual',
  syncedToGoogleCalendar: false,
  createdAt: '2026-06-21T00:00:00.000Z',
  updatedAt: '2026-06-21T00:00:00.000Z',
}

const session: PomodoroSession = {
  id: 'session-1',
  taskId: task.id,
  type: 'focus',
  startedAt: '2026-06-21T01:00:00.000Z',
  endedAt: '2026-06-21T01:25:00.000Z',
  completed: true,
}

const calendarEvent: CalendarEvent = {
  id: 'calendar-1',
  title: 'Readonly external event',
  start: '2026-06-21T03:00:00.000Z',
  end: '2026-06-21T04:00:00.000Z',
  source: 'google_calendar',
  readonly: true,
}

const customSettings: Settings = { ...defaultSettings, workMinutes: 40 }

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

describe('localAppDataDexieRepository', () => {
  it('reads tasks from Dexie', async () => {
    await db.tasks.put(task)
    await expect(localAppDataDexieRepository.getTasks()).resolves.toEqual([task])
  })

  it('replaces tasks in Dexie', async () => {
    await db.tasks.put({ ...task, id: 'old-task' })
    await localAppDataDexieRepository.saveTasks([task])
    await expect(db.tasks.toArray()).resolves.toEqual([task])
  })

  it('reads scheduled blocks from Dexie', async () => {
    await db.scheduledBlocks.put(block)
    await expect(
      localAppDataDexieRepository.getScheduledBlocks(),
    ).resolves.toEqual([block])
  })

  it('replaces scheduled blocks in Dexie', async () => {
    await db.scheduledBlocks.put({ ...block, id: 'old-block' })
    await localAppDataDexieRepository.saveScheduledBlocks([block])
    await expect(db.scheduledBlocks.toArray()).resolves.toEqual([block])
  })

  it('reads settings without exposing the fixed record id', async () => {
    await db.settings.put({ ...customSettings, id: 'default' })
    await expect(localAppDataDexieRepository.getSettings()).resolves.toEqual(
      customSettings,
    )
  })

  it('saves settings with the fixed record id', async () => {
    await localAppDataDexieRepository.saveSettings(customSettings)
    await expect(db.settings.get('default')).resolves.toEqual({
      ...customSettings,
      id: 'default',
    })
  })

  it('reads Pomodoro sessions from Dexie', async () => {
    await db.pomodoroSessions.put(session)
    await expect(
      localAppDataDexieRepository.getPomodoroSessions(),
    ).resolves.toEqual([session])
  })

  it('replaces Pomodoro sessions in Dexie', async () => {
    await db.pomodoroSessions.put({ ...session, id: 'old-session' })
    await localAppDataDexieRepository.savePomodoroSessions([session])
    await expect(db.pomodoroSessions.toArray()).resolves.toEqual([session])
  })

  it('does not read or write calendar events', async () => {
    await db.calendarEvents.put(calendarEvent)

    await localAppDataDexieRepository.saveTasks([task])
    await localAppDataDexieRepository.saveScheduledBlocks([block])
    await localAppDataDexieRepository.saveSettings(customSettings)
    await localAppDataDexieRepository.savePomodoroSessions([session])

    await expect(db.calendarEvents.toArray()).resolves.toEqual([calendarEvent])
    expect('getCalendarEvents' in localAppDataDexieRepository).toBe(false)
    expect('saveCalendarEvents' in localAppDataDexieRepository).toBe(false)
  })

  it('rolls back every app-owned table when replaceAllAppData fails', async () => {
    const originalTask = { ...task, id: 'original-task' }
    const originalBlock = {
      ...block,
      id: 'original-block',
      taskId: originalTask.id,
    }
    const originalSession = { ...session, id: 'original-session' }
    await db.tasks.put(originalTask)
    await db.scheduledBlocks.put(originalBlock)
    await db.settings.put({ ...defaultSettings, id: 'default' })
    await db.pomodoroSessions.put(originalSession)
    const failure = vi
      .spyOn(db.pomodoroSessions, 'bulkPut')
      .mockRejectedValueOnce(new Error('Simulated transaction failure'))

    await expect(
      localAppDataDexieRepository.replaceAllAppData({
        tasks: [task],
        scheduledBlocks: [block],
        settings: customSettings,
        pomodoroSessions: [session],
      }),
    ).rejects.toThrow('Simulated transaction failure')
    failure.mockRestore()

    await expect(db.tasks.toArray()).resolves.toEqual([originalTask])
    await expect(db.scheduledBlocks.toArray()).resolves.toEqual([originalBlock])
    await expect(db.settings.get('default')).resolves.toEqual({
      ...defaultSettings,
      id: 'default',
    })
    await expect(db.pomodoroSessions.toArray()).resolves.toEqual([
      originalSession,
    ])
  })
})
