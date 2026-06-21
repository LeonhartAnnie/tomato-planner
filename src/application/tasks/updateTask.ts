import {
  validateEstimatedMinutes,
  validateTaskTitle,
} from '../../domain/task/taskRules'
import type { Task } from '../../types'
import { nowIso } from '../../utils/dateTime'
import type { TaskRepository } from './taskRepository'

export const updateTask = async (
  task: Task,
  repository: TaskRepository,
): Promise<Task> => {
  validateTaskTitle(task.title)
  validateEstimatedMinutes(task.estimatedMinutes)

  const updatedTask: Task = {
    ...task,
    updatedAt: nowIso(),
  }

  await repository.updateTask(updatedTask)
  return updatedTask
}
