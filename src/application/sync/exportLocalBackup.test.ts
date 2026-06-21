import { describe, expect, it, vi } from 'vitest'
import { defaultSettings } from '../../domain/settings/defaultSettings'
import type { PomodoroSession, ScheduledBlock, Task } from '../../types'
import { exportLocalBackup } from './exportLocalBackup'
import type { LocalAppDataRepository } from './localAppDataRepository'

const task: Task = {
  id: 'task-1',
  title: 'Backup task',
  estimatedMinutes: 25,
  splittable: false,
  createdAt: '2026-06-20T00:00:00.000Z',
  updatedAt: '2026-06-20T00:00:00.000Z',
}

const block: ScheduledBlock = {
  id: 'block-1',
  taskId: task.id,
  title: task.title,
  start: '2026-06-21T01:00:00.000Z',
  end: '2026-06-21T01:25:00.000Z',
  source: 'manual',
  syncedToGoogleCalendar: false,
  createdAt: '2026-06-20T00:00:00.000Z',
  updatedAt: '2026-06-20T00:00:00.000Z',
}

const session: PomodoroSession = {
  id: 'session-1',
  taskId: task.id,
  type: 'focus',
  startedAt: '2026-06-21T01:00:00.000Z',
  endedAt: '2026-06-21T01:25:00.000Z',
  completed: true,
}

describe('exportLocalBackup', () => {
  it('uses the latest app-owned data timestamp instead of the sync clock', async () => {
    const repository: LocalAppDataRepository = {
      getTasks: vi.fn().mockResolvedValue([task]),
      saveTasks: vi.fn(),
      getScheduledBlocks: vi.fn().mockResolvedValue([block]),
      saveScheduledBlocks: vi.fn(),
      getSettings: vi.fn().mockResolvedValue(defaultSettings),
      saveSettings: vi.fn(),
      getPomodoroSessions: vi.fn().mockResolvedValue([session]),
      savePomodoroSessions: vi.fn(),
    }

    const backup = await exportLocalBackup(repository)

    expect(backup).toEqual({
      version: 1,
      updatedAt: session.endedAt,
      tasks: [task],
      scheduledBlocks: [block],
      settings: defaultSettings,
      pomodoroSessions: [session],
    })
    expect(backup).not.toHaveProperty('calendarEvents')
    expect(backup).not.toHaveProperty('activeTimer')
  })

  it('uses the Unix epoch when timestamped app-owned data is empty', async () => {
    const repository: LocalAppDataRepository = {
      getTasks: vi.fn().mockResolvedValue([]),
      saveTasks: vi.fn(),
      getScheduledBlocks: vi.fn().mockResolvedValue([]),
      saveScheduledBlocks: vi.fn(),
      getSettings: vi.fn().mockResolvedValue(defaultSettings),
      saveSettings: vi.fn(),
      getPomodoroSessions: vi.fn().mockResolvedValue([]),
      savePomodoroSessions: vi.fn(),
    }

    const backup = await exportLocalBackup(repository)

    expect(backup.updatedAt).toBe('1970-01-01T00:00:00.000Z')
  })
})
