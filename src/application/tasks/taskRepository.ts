import type { Task } from '../../types'

export interface TaskRepository {
  getAllTasks(): Promise<Task[]>
  addTask(task: Task): Promise<void>
  updateTask(task: Task): Promise<void>
  deleteTask(id: string): Promise<void>
}
