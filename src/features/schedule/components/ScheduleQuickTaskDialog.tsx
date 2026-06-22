import { useEffect, useState } from 'react'
import type { CreateTaskInput } from '../../../application/tasks/createTask'
import { TaskForm } from '../../tasks/components/TaskForm'

interface ScheduleQuickTaskDialogProps {
  isSubmitting: boolean
  error?: string | null
  defaultEstimatedMinutes: number
  onCreate: (input: CreateTaskInput) => Promise<boolean>
  onClose: () => void
}

export function ScheduleQuickTaskDialog({
  isSubmitting,
  error,
  defaultEstimatedMinutes,
  onCreate,
  onClose,
}: ScheduleQuickTaskDialogProps) {
  const [showError, setShowError] = useState(false)
  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSubmitting) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isSubmitting, onClose])

  const handleCreate = async (input: CreateTaskInput) => {
    setShowError(true)
    const succeeded = await onCreate(input)
    if (succeeded) {
      onClose()
    }
    return succeeded
  }

  return (
    <div className="schedule-dialog-overlay">
      <section
        className="schedule-quick-task-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="schedule-quick-task-dialog-title"
      >
        <TaskForm
          heading="快速新增任務"
          headingId="schedule-quick-task-dialog-title"
          defaultEstimatedMinutes={defaultEstimatedMinutes}
          isSubmitting={isSubmitting}
          onSubmit={handleCreate}
          onCancelEdit={onClose}
        />
        {showError && error && (
          <p className="error-message schedule-quick-task-error" role="alert">
            {error}
          </p>
        )}
        <button
          type="button"
          className="schedule-quick-task-close"
          disabled={isSubmitting}
          onClick={onClose}
        >
          取消
        </button>
      </section>
    </div>
  )
}
