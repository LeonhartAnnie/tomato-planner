import { useEffect, useRef, useState } from 'react'
import type { CreateTaskInput } from '../application/tasks/createTask'
import { TaskForm } from '../features/tasks/components/TaskForm'
import { TaskList } from '../features/tasks/components/TaskList'
import { useTaskStore } from '../stores/taskStore'
import { useSettingsStore } from '../stores/settingsStore'
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
  const [successMessage, setSuccessMessage] = useState<string>()
  const titleInputRef = useRef<HTMLInputElement>(null)
  const defaultEstimatedMinutes = useSettingsStore(
    (state) => state.settings.defaultTaskDurationMinutes,
  )
  const settingsLoading = useSettingsStore((state) => state.isLoading)
  const settingsError = useSettingsStore((state) => state.error)
  const loadSettings = useSettingsStore((state) => state.loadSettings)
  const isBusy = isLoading || settingsLoading

  useEffect(() => {
    void loadTasks()
    void loadSettings()
  }, [loadSettings, loadTasks])

  const handleSubmit = async (input: CreateTaskInput): Promise<boolean> => {
    setSuccessMessage(undefined)
    if (!editingTask) {
      const succeeded = await addTask(input)
      setSuccessMessage(succeeded ? '已新增任務。' : undefined)
      return succeeded
    }

    const succeeded = await updateTask({
      ...editingTask,
      ...input,
      splittable: input.splittable ?? false,
    })
    if (succeeded) {
      setEditingTask(undefined)
      setSuccessMessage('任務已更新。')
    }
    return succeeded
  }

  const handleDelete = async (id: string) => {
    setSuccessMessage(undefined)
    const succeeded = await deleteTask(id)
    if (succeeded && editingTask?.id === id) {
      setEditingTask(undefined)
    }
    setSuccessMessage(succeeded ? '任務已刪除。' : undefined)
  }

  const focusCreateTaskForm = () => {
    setEditingTask(undefined)
    titleInputRef.current?.focus()
  }

  return (
    <section>
      <h1>任務</h1>
      {(error || settingsError) && <p className="error-message" role="alert">{error ?? settingsError}</p>}
      {isBusy && <p role="status">處理中…</p>}
      {successMessage && <p className="success-message" role="status">{successMessage}</p>}

      <div className="tasks-layout">
        <TaskForm
          editingTask={editingTask}
          isSubmitting={isBusy}
          defaultEstimatedMinutes={defaultEstimatedMinutes}
          titleInputRef={titleInputRef}
          onSubmit={handleSubmit}
          onCancelEdit={() => setEditingTask(undefined)}
        />
        <TaskList
          tasks={tasks}
          isBusy={isBusy}
          onEdit={setEditingTask}
          onDelete={(id) => void handleDelete(id)}
          onCreateFirstTask={focusCreateTaskForm}
        />
      </div>
    </section>
  )
}
