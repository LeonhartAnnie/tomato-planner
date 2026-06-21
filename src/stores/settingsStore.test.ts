import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defaultSettings } from '../domain/settings/defaultSettings'
import { settingsDexieRepository } from '../infrastructure/repositories/settingsDexieRepository'
import type { Settings } from '../types'
import { useSettingsStore } from './settingsStore'

vi.mock('../infrastructure/repositories/settingsDexieRepository', () => ({
  settingsDexieRepository: {
    getSettings: vi.fn(),
    saveSettings: vi.fn(),
    resetSettings: vi.fn(),
  },
}))

const savedSettings: Settings = {
  ...defaultSettings,
  workMinutes: 50,
  calendarViewStartHour: 7,
  calendarViewEndHour: 20,
}

beforeEach(() => {
  useSettingsStore.setState({
    settings: defaultSettings,
    isLoading: false,
    error: null,
  })
  vi.resetAllMocks()
  vi.mocked(settingsDexieRepository.getSettings).mockResolvedValue(
    savedSettings,
  )
  vi.mocked(settingsDexieRepository.saveSettings).mockResolvedValue()
  vi.mocked(settingsDexieRepository.resetSettings).mockResolvedValue(
    defaultSettings,
  )
})

describe('settingsStore', () => {
  it('loads settings', async () => {
    await useSettingsStore.getState().loadSettings()
    expect(useSettingsStore.getState().settings).toEqual(savedSettings)
  })

  it('updates workMinutes', async () => {
    await useSettingsStore.getState().updateSettings({ workMinutes: 45 })

    expect(useSettingsStore.getState().settings.workMinutes).toBe(45)
    expect(settingsDexieRepository.saveSettings).toHaveBeenCalledWith({
      ...defaultSettings,
      workMinutes: 45,
    })
  })

  it('sets an error for invalid settings', async () => {
    await useSettingsStore.getState().updateSettings({ workMinutes: 0 })

    expect(useSettingsStore.getState().error).toBeTruthy()
    expect(settingsDexieRepository.saveSettings).not.toHaveBeenCalled()
  })

  it('resets to default settings', async () => {
    useSettingsStore.setState({ settings: savedSettings })

    await useSettingsStore.getState().resetSettings()

    expect(useSettingsStore.getState().settings).toEqual(defaultSettings)
  })

  it('sets isLoading while loading and clears it afterward', async () => {
    let resolveSettings: (settings: Settings) => void = () => undefined
    const pendingSettings = new Promise<Settings>((resolve) => {
      resolveSettings = resolve
    })
    vi.mocked(settingsDexieRepository.getSettings).mockReturnValue(
      pendingSettings,
    )

    const loading = useSettingsStore.getState().loadSettings()
    expect(useSettingsStore.getState().isLoading).toBe(true)

    resolveSettings(savedSettings)
    await loading
    expect(useSettingsStore.getState().isLoading).toBe(false)
  })

  it('does not access real Dexie', async () => {
    await useSettingsStore.getState().updateSettings({ shortBreakMinutes: 10 })
    expect(settingsDexieRepository.saveSettings).toHaveBeenCalledOnce()
  })
})
