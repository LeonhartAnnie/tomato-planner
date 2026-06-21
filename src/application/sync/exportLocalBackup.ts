import { getLocalAppDataUpdatedAt } from './getLocalAppDataUpdatedAt'
import type { LocalAppDataRepository } from './localAppDataRepository'
import type { CloudBackupData } from './syncTypes'

export const exportLocalBackup = async (
  repository: LocalAppDataRepository,
): Promise<CloudBackupData> => {
  const [tasks, scheduledBlocks, settings, pomodoroSessions] =
    await Promise.all([
      repository.getTasks(),
      repository.getScheduledBlocks(),
      repository.getSettings(),
      repository.getPomodoroSessions(),
    ])

  const snapshot = {
    tasks,
    scheduledBlocks,
    settings,
    pomodoroSessions,
  }

  return {
    version: 1,
    updatedAt: getLocalAppDataUpdatedAt(snapshot),
    ...snapshot,
  }
}
