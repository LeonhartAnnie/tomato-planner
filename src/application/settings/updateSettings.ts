import { validateSettings } from '../../domain/settings/settingsRules'
import type { Settings } from '../../types'
import type { SettingsRepository } from './settingsRepository'

export const updateSettings = async (
  currentSettings: Settings,
  updates: Partial<Settings>,
  repository: SettingsRepository,
): Promise<Settings> => {
  const nextSettings = { ...currentSettings, ...updates }
  validateSettings(nextSettings)

  await repository.saveSettings(nextSettings)
  return nextSettings
}
