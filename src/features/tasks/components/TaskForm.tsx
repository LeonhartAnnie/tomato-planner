import { useEffect, useState, type FormEvent } from 'react'
import type { CreateTaskInput } from '../../../application/tasks/createTask'
import type { Task } from '../../../types'
import {
  CUSTOM_TASK_CATEGORY_OPTION,
  DEFAULT_TASK_CATEGORIES,
  FALLBACK_TASK_CATEGORY,
} from '../../../domain/task/taskCategories'
import {
  fromDateTimeLocalValue,
  toDateTimeLocalValue,
} from '../../../utils/dateTime'

interface TaskFormProps {
  editingTask?: Task
  isSubmitting: boolean
  onSubmit: (input: CreateTaskInput) => Promise<boolean>
  onCancelEdit: () => void
  heading?: string
  headingId?: string
  defaultEstimatedMinutes?: number
}

interface TaskFormState {
  title: string
  estimatedMinutes: string
  category: string
  customCategory: string
  location: string
  note: string
  deadline: string
  splittable: boolean
}

const createEmptyForm = (defaultEstimatedMinutes: number): TaskFormState => ({
  title: '',
  estimatedMinutes: defaultEstimatedMinutes.toString(),
  category: FALLBACK_TASK_CATEGORY,
  customCategory: '',
  location: '',
  note: '',
  deadline: '',
  splittable: false,
})

const optionalText = (value: string): string | undefined =>
  value.trim() || undefined

export function TaskForm({
  editingTask,
  isSubmitting,
  onSubmit,
  onCancelEdit,
  heading,
  headingId,
  defaultEstimatedMinutes = 25,
}: TaskFormProps) {
  const [form, setForm] = useState<TaskFormState>(() =>
    createEmptyForm(defaultEstimatedMinutes),
  )

  useEffect(() => {
    const editingCategory = editingTask?.category?.trim()
    const isDefaultCategory = DEFAULT_TASK_CATEGORIES.some(
      (category) => category === editingCategory,
    )
    setForm(
      editingTask
        ? {
            title: editingTask.title,
            estimatedMinutes: editingTask.estimatedMinutes.toString(),
            category: isDefaultCategory
              ? (editingCategory ?? FALLBACK_TASK_CATEGORY)
              : editingCategory
                ? CUSTOM_TASK_CATEGORY_OPTION
                : FALLBACK_TASK_CATEGORY,
            customCategory:
              editingCategory && !isDefaultCategory ? editingCategory : '',
            location: editingTask.location ?? '',
            note: editingTask.note ?? '',
            deadline: toDateTimeLocalValue(editingTask.deadline),
            splittable: editingTask.splittable,
          }
        : createEmptyForm(defaultEstimatedMinutes),
    )
  }, [defaultEstimatedMinutes, editingTask])

  const updateField = <Key extends keyof TaskFormState>(
    key: Key,
    value: TaskFormState[Key],
  ) => setForm((current) => ({ ...current, [key]: value }))

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const succeeded = await onSubmit({
      title: form.title,
      estimatedMinutes: Number(form.estimatedMinutes),
      category:
        form.category === CUSTOM_TASK_CATEGORY_OPTION
          ? optionalText(form.customCategory) ?? FALLBACK_TASK_CATEGORY
          : form.category,
      location: optionalText(form.location),
      note: optionalText(form.note),
      deadline: fromDateTimeLocalValue(form.deadline),
      splittable: form.splittable,
    })

    if (succeeded) {
      setForm(createEmptyForm(defaultEstimatedMinutes))
    }
  }

  return (
    <form className="task-form" onSubmit={(event) => void handleSubmit(event)}>
      <h2 id={headingId}>
        {heading ?? (editingTask ? '編輯任務' : '新增任務')}
      </h2>

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
        分類
        <select
          value={form.category}
          onChange={(event) => updateField('category', event.target.value)}
        >
          {DEFAULT_TASK_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
          <option value={CUSTOM_TASK_CATEGORY_OPTION}>
            {CUSTOM_TASK_CATEGORY_OPTION}
          </option>
        </select>
      </label>

      {form.category === CUSTOM_TASK_CATEGORY_OPTION && (
        <label>
          自訂分類
          <input
            value={form.customCategory}
            onChange={(event) =>
              updateField('customCategory', event.target.value)
            }
            placeholder="例如：個人專案"
          />
        </label>
      )}

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
