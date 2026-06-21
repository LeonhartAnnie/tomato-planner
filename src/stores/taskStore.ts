import { create } from 'zustand'
import {
  createTask,
  type CreateTaskInput,
} from '../application/tasks/createTask'
import { updateTask as persistTaskUpdate } from '../application/tasks/updateTask'
import { taskDexieRepository } from '../infrastructure/repositories/taskDexieRepository'
import type { Task } from '../types'
import { toErrorMessage } from '../utils/error'

interface TaskState {
  tasks: Task[]
  isLoading: boolean
  error: string | null
  loadTasks: () => Promise<void>
  addTask: (input: CreateTaskInput) => Promise<boolean>
  updateTask: (task: Task) => Promise<boolean>
  deleteTask: (id: string) => Promise<boolean>
}

export const useTaskStore = create<TaskState>((set) => ({
  tasks: [],
  isLoading: false,
  error: null,

  loadTasks: async () => {
    set({ isLoading: true, error: null })
    try {
      set({ tasks: await taskDexieRepository.getAllTasks() })
    } catch (error: unknown) {
      set({ error: toErrorMessage(error) })
    } finally {
      set({ isLoading: false })
    }
  },

  addTask: async (input) => {
    set({ isLoading: true, error: null })
    try {
      const task = await createTask(input, taskDexieRepository)
      set((state) => ({ tasks: [...state.tasks, task] }))
      return true
    } catch (error: unknown) {
      set({ error: toErrorMessage(error) })
      return false
    } finally {
      set({ isLoading: false })
    }
  },

  updateTask: async (task) => {
    set({ isLoading: true, error: null })
    try {
      const updatedTask = await persistTaskUpdate(task, taskDexieRepository)
      set((state) => ({
        tasks: state.tasks.map((item) =>
          item.id === updatedTask.id ? updatedTask : item,
        ),
      }))
      return true
    } catch (error: unknown) {
      set({ error: toErrorMessage(error) })
      return false
    } finally {
      set({ isLoading: false })
    }
  },

  deleteTask: async (id) => {
    set({ isLoading: true, error: null })
    try {
      await taskDexieRepository.deleteTask(id)
      set((state) => ({
        tasks: state.tasks.filter((task) => task.id !== id),
      }))
      return true
    } catch (error: unknown) {
      set({ error: toErrorMessage(error) })
      return false
    } finally {
      set({ isLoading: false })
    }
  },
}))
