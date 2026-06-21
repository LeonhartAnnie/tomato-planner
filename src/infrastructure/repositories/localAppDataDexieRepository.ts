import type { LocalAppDataRepository } from '../../application/sync/localAppDataRepository'
import { db } from '../../db'
import { settingsDexieRepository } from './settingsDexieRepository'

export const localAppDataDexieRepository = {
  getTasks: () => db.tasks.toArray(),
  saveTasks: async (tasks) => {
    await db.transaction('rw', db.tasks, async () => {
      await db.tasks.clear()
      await db.tasks.bulkPut(tasks)
    })
  },

  getScheduledBlocks: () => db.scheduledBlocks.toArray(),
  saveScheduledBlocks: async (blocks) => {
    await db.transaction('rw', db.scheduledBlocks, async () => {
      await db.scheduledBlocks.clear()
      await db.scheduledBlocks.bulkPut(blocks)
    })
  },

  getSettings: () => settingsDexieRepository.getSettings(),
  saveSettings: (settings) => settingsDexieRepository.saveSettings(settings),

  getPomodoroSessions: () => db.pomodoroSessions.toArray(),
  savePomodoroSessions: async (sessions) => {
    await db.transaction('rw', db.pomodoroSessions, async () => {
      await db.pomodoroSessions.clear()
      await db.pomodoroSessions.bulkPut(sessions)
    })
  },

  replaceAllAppData: async (data) => {
    await db.transaction(
      'rw',
      db.tasks,
      db.scheduledBlocks,
      db.settings,
      db.pomodoroSessions,
      async () => {
        await db.tasks.clear()
        await db.scheduledBlocks.clear()
        await db.settings.clear()
        await db.pomodoroSessions.clear()
        await db.tasks.bulkPut(data.tasks)
        await db.scheduledBlocks.bulkPut(data.scheduledBlocks)
        await db.settings.put({ ...data.settings, id: 'default' })
        await db.pomodoroSessions.bulkPut(data.pomodoroSessions)
      },
    )
  },
} satisfies LocalAppDataRepository
