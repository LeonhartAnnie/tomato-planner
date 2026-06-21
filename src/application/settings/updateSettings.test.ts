import { describe, expect, it, vi } from 'vitest'
import type { Settings } from '../../types'
import type { SettingsRepository } from './settingsRepository'
import { updateSettings } from './updateSettings'

const currentSettings: Settings = {
  workMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  longBreakInterval: 4,
  calendarViewStartHour: 8,
  calendarViewEndHour: 22,
  defaultTaskDurationMinutes: 25,
}

const createRepository = (): SettingsRepository => ({
  getSettings: vi.fn().mockResolvedValue(currentSettings),
  saveSettings: vi.fn().mockResolvedValue(undefined),
  resetSettings: vi.fn().mockResolvedValue(currentSettings),
})

describe('updateSettings', () => {
  it('merges valid updates into current settings', async () => {
    const next = await updateSettings(
      currentSettings,
      { workMinutes: 50 },
      createRepository(),
    )
    expect(next).toEqual({ ...currentSettings, workMinutes: 50 })
  })

  it('rejects invalid merged settings', async () => {
    await expect(
      updateSettings(currentSettings, { workMinutes: 0 }, createRepository()),
    ).rejects.toThrow()
  })

  it('saves the merged settings through the repository', async () => {
    const repository = createRepository()
    const next = await updateSettings(
      currentSettings,
      { shortBreakMinutes: 10 },
      repository,
    )
    expect(repository.saveSettings).toHaveBeenCalledWith(next)
  })

  it('returns the updated settings', async () => {
    const next = await updateSettings(
      currentSettings,
      { calendarViewEndHour: 20 },
      createRepository(),
    )
    expect(next.calendarViewEndHour).toBe(20)
  })
})
