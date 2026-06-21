import type { Settings } from '../../types'

export interface SettingsRepository {
  getSettings(): Promise<Settings>
  saveSettings(settings: Settings): Promise<void>
  resetSettings(): Promise<Settings>
}
