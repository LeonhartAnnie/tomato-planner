import {
  validateEstimatedMinutes,
  validateTaskTitle,
} from '../../domain/task/taskRules'
import type { Task } from '../../types'
import { nowIso } from '../../utils/dateTime'
import { createId } from '../../utils/id'
import type { TaskRepository } from './taskRepository'

export interface CreateTaskInput {
  title: string
  estimatedMinutes: number
  category?: string
  location?: string
  note?: string
  deadline?: string
  splittable?: boolean
}

export const createTask = async (
  input: CreateTaskInput,
  repository: TaskRepository,
): Promise<Task> => {
  validateTaskTitle(input.title)
  validateEstimatedMinutes(input.estimatedMinutes)

  const timestamp = nowIso()
  const task: Task = {
    ...input,
    id: createId('task'),
    splittable: input.splittable ?? false,
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  await repository.addTask(task)
  return task
}
