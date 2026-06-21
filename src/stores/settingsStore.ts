import { create } from 'zustand'
import { updateSettings as persistSettingsUpdate } from '../application/settings/updateSettings'
import { defaultSettings } from '../domain/settings/defaultSettings'
import { settingsDexieRepository } from '../infrastructure/repositories/settingsDexieRepository'
import type { Settings } from '../types'
import { toErrorMessage } from '../utils/error'

interface SettingsState {
  settings: Settings
  isLoading: boolean
  error: string | null
  loadSettings: () => Promise<void>
  updateSettings: (updates: Partial<Settings>) => Promise<boolean>
  resetSettings: () => Promise<boolean>
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: defaultSettings,
  isLoading: false,
  error: null,

  loadSettings: async () => {
    set({ isLoading: true, error: null })
    try {
      set({ settings: await settingsDexieRepository.getSettings() })
    } catch (error: unknown) {
      set({ error: toErrorMessage(error) })
    } finally {
      set({ isLoading: false })
    }
  },

  updateSettings: async (updates) => {
    set({ isLoading: true, error: null })
    try {
      const settings = await persistSettingsUpdate(
        get().settings,
        updates,
        settingsDexieRepository,
      )
      set({ settings })
      return true
    } catch (error: unknown) {
      set({ error: toErrorMessage(error) })
      return false
    } finally {
      set({ isLoading: false })
    }
  },

  resetSettings: async () => {
    set({ isLoading: true, error: null })
    try {
      const settings = await settingsDexieRepository.resetSettings()
      set({ settings: { ...settings } })
      return true
    } catch (error: unknown) {
      set({ error: toErrorMessage(error) })
      return false
    } finally {
      set({ isLoading: false })
    }
  },
}))
