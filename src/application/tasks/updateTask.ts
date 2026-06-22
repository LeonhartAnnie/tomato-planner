import {
  validateEstimatedMinutes,
  validateTaskTitle,
} from '../../domain/task/taskRules'
import { normalizeTaskCategory } from '../../domain/task/taskCategories'
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
    category: normalizeTaskCategory(task.category),
    updatedAt: nowIso(),
  }

  await repository.updateTask(updatedTask)
  return updatedTask
}
