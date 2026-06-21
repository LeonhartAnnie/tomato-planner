import { describe, expect, it, vi } from 'vitest'
import { defaultSettings } from '../../domain/settings/defaultSettings'
import type { CloudBackupRepository } from './cloudBackupRepository'
import type { LocalAppDataRepository } from './localAppDataRepository'
import { uploadLocalBackup } from './uploadLocalBackup'

const task = {
  id: 'task-1',
  title: 'Local task',
  estimatedMinutes: 25,
  splittable: false,
  createdAt: '2026-06-21T08:00:00.000Z',
  updatedAt: '2026-06-21T09:00:00.000Z',
}

const createLocalRepository = () => ({
  getTasks: vi.fn().mockResolvedValue([task]),
  saveTasks: vi.fn(),
  getScheduledBlocks: vi.fn().mockResolvedValue([]),
  saveScheduledBlocks: vi.fn(),
  getSettings: vi.fn().mockResolvedValue(defaultSettings),
  saveSettings: vi.fn(),
  getPomodoroSessions: vi.fn().mockResolvedValue([]),
  savePomodoroSessions: vi.fn(),
  calendarEvents: [{ id: 'external-event' }],
  activeTimer: { id: 'active-timer' },
}) satisfies LocalAppDataRepository & {
  calendarEvents: unknown[]
  activeTimer: object
}

describe('uploadLocalBackup', () => {
  it('exports local data and overwrites the cloud backup without reading it', async () => {
    const localRepository = createLocalRepository()
    const cloudRepository: CloudBackupRepository = {
      getBackup: vi.fn(),
      saveBackup: vi.fn().mockResolvedValue(undefined),
    }

    const result = await uploadLocalBackup(
      localRepository,
      cloudRepository,
      () => '2026-06-21T10:00:00.000Z',
    )

    expect(result).toEqual({
      uploadedAt: '2026-06-21T10:00:00.000Z',
      backupUpdatedAt: task.updatedAt,
    })
    expect(cloudRepository.getBackup).not.toHaveBeenCalled()
    expect(cloudRepository.saveBackup).toHaveBeenCalledOnce()
    expect(cloudRepository.saveBackup).toHaveBeenCalledWith(
      expect.objectContaining({ tasks: [task], updatedAt: task.updatedAt }),
    )
  })

  it('does not include CalendarEvent or active timer state', async () => {
    const cloudRepository: CloudBackupRepository = {
      getBackup: vi.fn(),
      saveBackup: vi.fn().mockResolvedValue(undefined),
    }

    await uploadLocalBackup(createLocalRepository(), cloudRepository)

    const backup = vi.mocked(cloudRepository.saveBackup).mock.calls[0][0]
    expect(backup).not.toHaveProperty('calendarEvents')
    expect(backup).not.toHaveProperty('activeTimer')
  })
})
