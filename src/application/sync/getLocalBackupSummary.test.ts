import { describe, expect, it, vi } from 'vitest'
import { defaultSettings } from '../../domain/settings/defaultSettings'
import type { LocalAppDataRepository } from './localAppDataRepository'
import { APP_DATA_EPOCH } from './getLocalAppDataUpdatedAt'
import { getLocalBackupSummary } from './getLocalBackupSummary'

const createRepository = (): LocalAppDataRepository => ({
  getTasks: vi.fn().mockResolvedValue([]),
  saveTasks: vi.fn(),
  getScheduledBlocks: vi.fn().mockResolvedValue([]),
  saveScheduledBlocks: vi.fn(),
  getSettings: vi.fn().mockResolvedValue(defaultSettings),
  saveSettings: vi.fn(),
  getPomodoroSessions: vi.fn().mockResolvedValue([]),
  savePomodoroSessions: vi.fn(),
})

describe('getLocalBackupSummary', () => {
  it('summarizes empty app-owned data with the deterministic epoch', async () => {
    await expect(getLocalBackupSummary(createRepository())).resolves.toEqual({
      taskCount: 0,
      scheduledBlockCount: 0,
      pomodoroSessionCount: 0,
      hasSettings: true,
      latestDataUpdatedAt: APP_DATA_EPOCH,
    })
  })

  it('counts app-owned data and uses its latest modification time', async () => {
    const repository = createRepository()
    vi.mocked(repository.getTasks).mockResolvedValue([
      {
        id: 'task-1', title: 'Task', estimatedMinutes: 25,
        splittable: false, createdAt: '2026-06-21T08:00:00.000Z',
        updatedAt: '2026-06-21T09:00:00.000Z',
      },
    ])
    vi.mocked(repository.getScheduledBlocks).mockResolvedValue([
      {
        id: 'block-1', taskId: 'task-1', title: 'Task',
        start: '2026-06-21T10:00:00.000Z', end: '2026-06-21T10:25:00.000Z',
        source: 'manual', syncedToGoogleCalendar: false,
        createdAt: '2026-06-21T09:30:00.000Z',
        updatedAt: '2026-06-21T10:00:00.000Z',
      },
    ])
    vi.mocked(repository.getPomodoroSessions).mockResolvedValue([
      {
        id: 'session-1', type: 'focus',
        startedAt: '2026-06-21T11:00:00.000Z',
        endedAt: '2026-06-21T11:25:00.000Z', completed: true,
      },
    ])

    await expect(getLocalBackupSummary(repository)).resolves.toEqual({
      taskCount: 1,
      scheduledBlockCount: 1,
      pomodoroSessionCount: 1,
      hasSettings: true,
      latestDataUpdatedAt: '2026-06-21T11:25:00.000Z',
    })
  })

  it('only reads repository methods that expose backup-owned data', async () => {
    const repository = createRepository()
    await getLocalBackupSummary(repository)

    expect(repository.getTasks).toHaveBeenCalledOnce()
    expect(repository.getScheduledBlocks).toHaveBeenCalledOnce()
    expect(repository.getSettings).toHaveBeenCalledOnce()
    expect(repository.getPomodoroSessions).toHaveBeenCalledOnce()
    expect(repository).not.toHaveProperty('getCalendarEvents')
    expect(repository).not.toHaveProperty('getActiveTimer')
  })
})
