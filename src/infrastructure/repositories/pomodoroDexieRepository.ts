import type { PomodoroRepository } from '../../application/pomodoro/pomodoroRepository'
import { db } from '../../db'

export const pomodoroDexieRepository: PomodoroRepository = {
  getAllPomodoroSessions: () => db.pomodoroSessions.toArray(),
  addPomodoroSession: async (session) => {
    await db.pomodoroSessions.add(session)
  },
  updatePomodoroSession: async (session) => {
    await db.pomodoroSessions.put(session)
  },
  deletePomodoroSession: (id) => db.pomodoroSessions.delete(id),
}
