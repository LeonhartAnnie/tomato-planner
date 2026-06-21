import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { taskDexieRepository } from '../infrastructure/repositories/taskDexieRepository'
import type { Task } from '../types'
import { useTaskStore } from './taskStore'

vi.mock('../infrastructure/repositories/taskDexieRepository', () => ({
  taskDexieRepository: {
    getAllTasks: vi.fn(),
    addTask: vi.fn(),
    updateTask: vi.fn(),
    deleteTask: vi.fn(),
  },
}))

const task: Task = {
  id: 'task-1',
  title: '撰寫測試',
  estimatedMinutes: 25,
  splittable: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-06-21T02:00:00.000Z'))
  useTaskStore.setState({
    tasks: [],
    isLoading: false,
    error: null,
  })
  vi.resetAllMocks()
  vi.mocked(taskDexieRepository.getAllTasks).mockResolvedValue([])
  vi.mocked(taskDexieRepository.addTask).mockResolvedValue()
  vi.mocked(taskDexieRepository.updateTask).mockResolvedValue()
  vi.mocked(taskDexieRepository.deleteTask).mockResolvedValue()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('taskStore', () => {
  it('loads tasks through the repository', async () => {
    vi.mocked(taskDexieRepository.getAllTasks).mockResolvedValue([task])

    await useTaskStore.getState().loadTasks()

    expect(useTaskStore.getState().tasks).toEqual([task])
  })

  it('adds a task', async () => {
    await useTaskStore.getState().addTask({
      title: '新增任務',
      estimatedMinutes: 30,
    })

    expect(useTaskStore.getState().tasks).toHaveLength(1)
    expect(useTaskStore.getState().tasks[0]).toMatchObject({
      title: '新增任務',
      estimatedMinutes: 30,
      splittable: false,
    })
  })

  it('creates a task through the application use case', async () => {
    await useTaskStore.getState().addTask({
      title: 'Application task',
      estimatedMinutes: 25,
    })

    expect(taskDexieRepository.addTask).toHaveBeenCalledWith(
      expect.objectContaining({
        id: expect.any(String),
        title: 'Application task',
        createdAt: '2026-06-21T02:00:00.000Z',
        updatedAt: '2026-06-21T02:00:00.000Z',
      }),
    )
  })

  it('updates a task', async () => {
    useTaskStore.setState({ tasks: [task] })

    await useTaskStore.getState().updateTask({ ...task, title: '更新任務' })

    expect(useTaskStore.getState().tasks[0]).toMatchObject({
      id: task.id,
      title: '更新任務',
      createdAt: task.createdAt,
      updatedAt: '2026-06-21T02:00:00.000Z',
    })
    expect(taskDexieRepository.updateTask).toHaveBeenCalled()
  })

  it('deletes a task', async () => {
    useTaskStore.setState({ tasks: [task] })

    await useTaskStore.getState().deleteTask(task.id)

    expect(useTaskStore.getState().tasks).toEqual([])
    expect(taskDexieRepository.deleteTask).toHaveBeenCalledWith(task.id)
  })

  it('sets an error for an invalid title', async () => {
    await useTaskStore.getState().addTask({
      title: ' ',
      estimatedMinutes: 25,
    })

    expect(useTaskStore.getState().error).toBeTruthy()
    expect(taskDexieRepository.addTask).not.toHaveBeenCalled()
  })

  it('sets an error for invalid estimated minutes', async () => {
    await useTaskStore.getState().addTask({
      title: '無效任務',
      estimatedMinutes: 0,
    })

    expect(useTaskStore.getState().error).toBeTruthy()
    expect(taskDexieRepository.addTask).not.toHaveBeenCalled()
  })

  it('sets isLoading during an async operation and clears it afterward', async () => {
    let resolveTasks: (tasks: Task[]) => void = () => undefined
    const pendingTasks = new Promise<Task[]>((resolve) => {
      resolveTasks = resolve
    })
    vi.mocked(taskDexieRepository.getAllTasks).mockReturnValue(pendingTasks)

    const loading = useTaskStore.getState().loadTasks()
    expect(useTaskStore.getState().isLoading).toBe(true)

    resolveTasks([task])
    await loading

    expect(useTaskStore.getState().isLoading).toBe(false)
  })
})
