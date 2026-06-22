import { useEffect, useState } from 'react'
import type { CreateTaskInput } from '../application/tasks/createTask'
import { TaskForm } from '../features/tasks/components/TaskForm'
import { TaskList } from '../features/tasks/components/TaskList'
import { useTaskStore } from '../stores/taskStore'
import type { Task } from '../types'

export function TasksPage() {
  const tasks = useTaskStore((state) => state.tasks)
  const isLoading = useTaskStore((state) => state.isLoading)
  const error = useTaskStore((state) => state.error)
  const loadTasks = useTaskStore((state) => state.loadTasks)
  const addTask = useTaskStore((state) => state.addTask)
  const updateTask = useTaskStore((state) => state.updateTask)
  const deleteTask = useTaskStore((state) => state.deleteTask)
  const [editingTask, setEditingTask] = useState<Task>()

  useEffect(() => {
    void loadTasks()
  }, [loadTasks])

  const handleSubmit = async (input: CreateTaskInput): Promise<boolean> => {
    if (!editingTask) {
      return addTask(input)
    }

    const succeeded = await updateTask({
      ...editingTask,
      ...input,
      splittable: input.splittable ?? false,
    })
    if (succeeded) {
      setEditingTask(undefined)
    }
    return succeeded
  }

  const handleDelete = async (id: string) => {
    const succeeded = await deleteTask(id)
    if (succeeded && editingTask?.id === id) {
      setEditingTask(undefined)
    }
  }

  return (
    <section>
      <h1>任務</h1>
      {error && <p className="error-message" role="alert">{error}</p>}
      {isLoading && <p role="status">處理中…</p>}

      <div className="tasks-layout">
        <TaskForm
          editingTask={editingTask}
          isSubmitting={isLoading}
          onSubmit={handleSubmit}
          onCancelEdit={() => setEditingTask(undefined)}
        />
        <TaskList
          tasks={tasks}
          isBusy={isLoading}
          onEdit={setEditingTask}
          onDelete={(id) => void handleDelete(id)}
        />
      </div>
    </section>
  )
}
