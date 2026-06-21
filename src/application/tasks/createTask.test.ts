import { describe, expect, it, vi } from 'vitest'
import type { TaskRepository } from './taskRepository'
import { createTask, type CreateTaskInput } from './createTask'

const createRepository = (): TaskRepository => ({
  getAllTasks: vi.fn().mockResolvedValue([]),
  addTask: vi.fn().mockResolvedValue(undefined),
  updateTask: vi.fn().mockResolvedValue(undefined),
  deleteTask: vi.fn().mockResolvedValue(undefined),
})

const validInput: CreateTaskInput = {
  title: '撰寫測試',
  estimatedMinutes: 25,
}

describe('createTask', () => {
  it('creates a task from valid input', async () => {
    const task = await createTask(validInput, createRepository())

    expect(task).toMatchObject({
      title: validInput.title,
      estimatedMinutes: validInput.estimatedMinutes,
      splittable: false,
    })
  })

  it('rejects an empty title', async () => {
    await expect(
      createTask({ ...validInput, title: '' }, createRepository()),
    ).rejects.toThrow()
  })

  it('rejects non-positive estimated minutes', async () => {
    await expect(
      createTask({ ...validInput, estimatedMinutes: 0 }, createRepository()),
    ).rejects.toThrow()
  })

  it('generates an id', async () => {
    const task = await createTask(validInput, createRepository())
    expect(task.id).not.toBe('')
  })

  it('sets createdAt and updatedAt', async () => {
    const task = await createTask(validInput, createRepository())

    expect(Number.isNaN(Date.parse(task.createdAt))).toBe(false)
    expect(task.updatedAt).toBe(task.createdAt)
  })

  it('adds the task through the repository', async () => {
    const repository = createRepository()
    const task = await createTask(validInput, repository)

    expect(repository.addTask).toHaveBeenCalledWith(task)
  })
})
