import { useEffect, useState, type FormEvent } from 'react'
import type { CreateScheduledBlockInput } from '../../../application/schedule/createScheduledBlock'
import type { Task } from '../../../types'
import { fromDateTimeLocalValue } from '../../../utils/dateTime'

interface ScheduleBlockFormProps {
  tasks: Task[]
  isSubmitting: boolean
  onSubmit: (input: CreateScheduledBlockInput) => Promise<boolean>
}

export function ScheduleBlockForm({
  tasks,
  isSubmitting,
  onSubmit,
}: ScheduleBlockFormProps) {
  const [taskId, setTaskId] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')

  useEffect(() => {
    if (!tasks.some((task) => task.id === taskId)) {
      setTaskId(tasks[0]?.id ?? '')
    }
  }, [taskId, tasks])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const task = tasks.find((item) => item.id === taskId)
    const startIso = fromDateTimeLocalValue(start)
    const endIso = fromDateTimeLocalValue(end)

    if (!task || !startIso || !endIso) {
      return
    }

    const succeeded = await onSubmit({
      taskId: task.id,
      title: task.title,
      start: startIso,
      end: endIso,
      source: 'manual',
      syncedToGoogleCalendar: false,
    })

    if (succeeded) {
      setStart('')
      setEnd('')
    }
  }

  return (
    <form
      className="schedule-form"
      onSubmit={(event) => void handleSubmit(event)}
    >
      <h2>新增手動排程</h2>

      <label>
        任務
        <select
          required
          disabled={tasks.length === 0}
          value={taskId}
          onChange={(event) => setTaskId(event.target.value)}
        >
          {tasks.length === 0 && <option value="">尚無任務</option>}
          {tasks.map((task) => (
            <option key={task.id} value={task.id}>
              {task.title}
            </option>
          ))}
        </select>
      </label>

      <label>
        開始時間
        <input
          required
          type="datetime-local"
          value={start}
          onChange={(event) => setStart(event.target.value)}
        />
      </label>

      <label>
        結束時間
        <input
          required
          type="datetime-local"
          value={end}
          onChange={(event) => setEnd(event.target.value)}
        />
      </label>

      <button type="submit" disabled={isSubmitting || tasks.length === 0}>
        建立排程
      </button>
    </form>
  )
}
