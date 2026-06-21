import type { BackupSummary } from './backupSummary'
import { getLocalAppDataUpdatedAt } from './getLocalAppDataUpdatedAt'
import type {
  LocalAppDataRepository,
  LocalAppDataSnapshot,
} from './localAppDataRepository'

const readLocalSnapshot = async (
  repository: LocalAppDataRepository,
): Promise<LocalAppDataSnapshot> => {
  const [tasks, scheduledBlocks, settings, pomodoroSessions] =
    await Promise.all([
      repository.getTasks(),
      repository.getScheduledBlocks(),
      repository.getSettings(),
      repository.getPomodoroSessions(),
    ])

  return { tasks, scheduledBlocks, settings, pomodoroSessions }
}

export const getLocalBackupSummary = async (
  repository: LocalAppDataRepository,
): Promise<BackupSummary> => {
  const snapshot = await readLocalSnapshot(repository)

  return {
    taskCount: snapshot.tasks.length,
    scheduledBlockCount: snapshot.scheduledBlocks.length,
    pomodoroSessionCount: snapshot.pomodoroSessions.length,
    hasSettings: snapshot.settings !== undefined,
    latestDataUpdatedAt: getLocalAppDataUpdatedAt(snapshot),
  }
}
