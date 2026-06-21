import { useEffect, useState, type FormEvent } from 'react'
import type { CreateTaskInput } from '../../../application/tasks/createTask'
import type { Task } from '../../../types'
import {
  fromDateTimeLocalValue,
  toDateTimeLocalValue,
} from '../../../utils/dateTime'

interface TaskFormProps {
  editingTask?: Task
  isSubmitting: boolean
  onSubmit: (input: CreateTaskInput) => Promise<boolean>
  onCancelEdit: () => void
}

interface TaskFormState {
  title: string
  estimatedMinutes: string
  category: string
  location: string
  note: string
  deadline: string
  splittable: boolean
}

const emptyForm: TaskFormState = {
  title: '',
  estimatedMinutes: '25',
  category: '',
  location: '',
  note: '',
  deadline: '',
  splittable: false,
}

const optionalText = (value: string): string | undefined =>
  value.trim() || undefined

export function TaskForm({
  editingTask,
  isSubmitting,
  onSubmit,
  onCancelEdit,
}: TaskFormProps) {
  const [form, setForm] = useState<TaskFormState>(emptyForm)

  useEffect(() => {
    setForm(
      editingTask
        ? {
            title: editingTask.title,
            estimatedMinutes: editingTask.estimatedMinutes.toString(),
            category: editingTask.category ?? '',
            location: editingTask.location ?? '',
            note: editingTask.note ?? '',
            deadline: toDateTimeLocalValue(editingTask.deadline),
            splittable: editingTask.splittable,
          }
        : emptyForm,
    )
  }, [editingTask])

  const updateField = <Key extends keyof TaskFormState>(
    key: Key,
    value: TaskFormState[Key],
  ) => setForm((current) => ({ ...current, [key]: value }))

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const succeeded = await onSubmit({
      title: form.title,
      estimatedMinutes: Number(form.estimatedMinutes),
      category: optionalText(form.category),
      location: optionalText(form.location),
      note: optionalText(form.note),
      deadline: fromDateTimeLocalValue(form.deadline),
      splittable: form.splittable,
    })

    if (succeeded) {
      setForm(emptyForm)
    }
  }

  return (
    <form className="task-form" onSubmit={(event) => void handleSubmit(event)}>
      <h2>{editingTask ? '編輯任務' : '新增任務'}</h2>

      <label>
        標題
        <input
          required
          value={form.title}
          onChange={(event) => updateField('title', event.target.value)}
        />
      </label>

      <label>
        預估分鐘
        <input
          required
          min="1"
          type="number"
          value={form.estimatedMinutes}
          onChange={(event) =>
            updateField('estimatedMinutes', event.target.value)
          }
        />
      </label>

      <label>
        分類（選填）
        <input
          value={form.category}
          onChange={(event) => updateField('category', event.target.value)}
        />
      </label>

      <label>
        地點（選填）
        <input
          value={form.location}
          onChange={(event) => updateField('location', event.target.value)}
        />
      </label>

      <label className="full-width">
        備註（選填）
        <textarea
          rows={3}
          value={form.note}
          onChange={(event) => updateField('note', event.target.value)}
        />
      </label>

      <label>
        截止時間（選填）
        <input
          type="datetime-local"
          value={form.deadline}
          onChange={(event) => updateField('deadline', event.target.value)}
        />
      </label>

      <label className="checkbox-field">
        <input
          type="checkbox"
          checked={form.splittable}
          onChange={(event) => updateField('splittable', event.target.checked)}
        />
        可拆分任務
      </label>

      <div className="form-actions full-width">
        <button type="submit" disabled={isSubmitting}>
          {editingTask ? '儲存修改' : '新增任務'}
        </button>
        {editingTask && (
          <button type="button" className="secondary" onClick={onCancelEdit}>
            取消
          </button>
        )}
      </div>
    </form>
  )
}
