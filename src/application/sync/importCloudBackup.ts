import type { LocalAppDataRepository } from './localAppDataRepository'
import { assertCloudBackupData } from './validateCloudBackupData'

export const importCloudBackup = async (
  value: unknown,
  repository: LocalAppDataRepository,
): Promise<void> => {
  const backup = assertCloudBackupData(value)
  const appData = {
    tasks: backup.tasks,
    scheduledBlocks: backup.scheduledBlocks,
    settings: backup.settings,
    pomodoroSessions: backup.pomodoroSessions,
  }

  if (repository.replaceAllAppData) {
    await repository.replaceAllAppData(appData)
    return
  }

  await Promise.all([
    repository.saveTasks(backup.tasks),
    repository.saveScheduledBlocks(backup.scheduledBlocks),
    repository.saveSettings(backup.settings),
    repository.savePomodoroSessions(backup.pomodoroSessions),
  ])
}
