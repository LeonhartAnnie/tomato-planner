import type { SettingsRepository } from '../../application/settings/settingsRepository'
import { db } from '../../db'
import { defaultSettings } from '../../domain/settings/defaultSettings'
import type { Settings, SettingsRecord } from '../../types'

const SETTINGS_ID = 'default' as const

const removeRecordId = (record: SettingsRecord): Settings => ({
  workMinutes: record.workMinutes,
  shortBreakMinutes: record.shortBreakMinutes,
  longBreakMinutes: record.longBreakMinutes,
  longBreakInterval: record.longBreakInterval,
  calendarViewStartHour: record.calendarViewStartHour,
  calendarViewEndHour: record.calendarViewEndHour,
  defaultTaskDurationMinutes: record.defaultTaskDurationMinutes,
})

export const settingsDexieRepository: SettingsRepository = {
  getSettings: async () => {
    const record = await db.settings.get(SETTINGS_ID)
    return record ? removeRecordId(record) : defaultSettings
  },
  saveSettings: async (settings) => {
    await db.settings.put({ ...settings, id: SETTINGS_ID })
  },
  resetSettings: async () => {
    await db.settings.delete(SETTINGS_ID)
    return defaultSettings
  },
}
