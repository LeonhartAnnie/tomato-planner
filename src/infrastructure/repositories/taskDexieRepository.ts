import type { TaskRepository } from '../../application/tasks/taskRepository'
import { db } from '../../db'

export const taskDexieRepository: TaskRepository = {
  getAllTasks: () => db.tasks.toArray(),
  addTask: async (task) => {
    await db.tasks.add(task)
  },
  updateTask: async (task) => {
    await db.tasks.put(task)
  },
  deleteTask: (id) => db.tasks.delete(id),
}
