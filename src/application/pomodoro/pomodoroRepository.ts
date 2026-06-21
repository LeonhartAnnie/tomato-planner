import type { PomodoroSession } from '../../types'

export interface PomodoroRepository {
  getAllPomodoroSessions(): Promise<PomodoroSession[]>
  addPomodoroSession(session: PomodoroSession): Promise<void>
  updatePomodoroSession(session: PomodoroSession): Promise<void>
  deletePomodoroSession(id: string): Promise<void>
}
