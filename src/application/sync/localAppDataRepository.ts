import type {
  PomodoroSession,
  ScheduledBlock,
  Settings,
  Task,
} from '../../types'

export interface LocalAppDataSnapshot {
  tasks: Task[]
  scheduledBlocks: ScheduledBlock[]
  settings: Settings
  pomodoroSessions: PomodoroSession[]
}

export interface LocalAppDataRepository {
  getTasks(): Promise<Task[]>
  saveTasks(tasks: Task[]): Promise<void>
  getScheduledBlocks(): Promise<ScheduledBlock[]>
  saveScheduledBlocks(blocks: ScheduledBlock[]): Promise<void>
  getSettings(): Promise<Settings>
  saveSettings(settings: Settings): Promise<void>
  getPomodoroSessions(): Promise<PomodoroSession[]>
  savePomodoroSessions(sessions: PomodoroSession[]): Promise<void>
  replaceAllAppData?(data: LocalAppDataSnapshot): Promise<void>
}
