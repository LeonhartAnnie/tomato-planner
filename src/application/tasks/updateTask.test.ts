import { describe, expect, it, vi } from 'vitest'
import type { Task } from '../../types'
import type { TaskRepository } from './taskRepository'
import { updateTask } from './updateTask'

const createRepository = (): TaskRepository => ({
  getAllTasks: vi.fn().mockResolvedValue([]),
  addTask: vi.fn().mockResolvedValue(undefined),
  updateTask: vi.fn().mockResolvedValue(undefined),
  deleteTask: vi.fn().mockResolvedValue(undefined),
})

const task: Task = {
  id: 'task-1',
  title: '原始任務',
  estimatedMinutes: 25,
  splittable: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

describe('updateTask', () => {
  it('updates updatedAt for a valid task', async () => {
    const updated = await updateTask(task, createRepository())
    expect(updated.updatedAt).not.toBe(task.updatedAt)
  })

  it('preserves createdAt', async () => {
    const updated = await updateTask(task, createRepository())
    expect(updated.createdAt).toBe(task.createdAt)
  })

  it('rejects an invalid title', async () => {
    await expect(
      updateTask({ ...task, title: ' ' }, createRepository()),
    ).rejects.toThrow()
  })

  it('rejects invalid estimated minutes', async () => {
    await expect(
      updateTask({ ...task, estimatedMinutes: -1 }, createRepository()),
    ).rejects.toThrow()
  })

  it('updates the task through the repository', async () => {
    const repository = createRepository()
    const updated = await updateTask(task, repository)

    expect(repository.updateTask).toHaveBeenCalledWith(updated)
  })
})
