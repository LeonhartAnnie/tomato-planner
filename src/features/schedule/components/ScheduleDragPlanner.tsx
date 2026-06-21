import { DndContext, type DragEndEvent } from '@dnd-kit/core'
import { useMemo, useState, type FormEvent } from 'react'
import type { CreateScheduledBlockInput } from '../../../application/schedule/createScheduledBlock'
import type { CalendarEvent, ScheduledBlock, Task } from '../../../types'
import { toErrorMessage } from '../../../utils/error'
import { createDroppedTaskTimeRange } from '../selectors/dragScheduleHelpers'
import {
  getNextSevenDays,
  groupScheduleItemsByDate,
} from '../selectors/scheduleDisplaySelectors'
import { DraggableTaskCard } from './DraggableTaskCard'
import { DroppableScheduleDay } from './DroppableScheduleDay'

interface ScheduleDragPlannerProps {
  tasks: Task[]
  blocks: ScheduledBlock[]
  calendarEvents: CalendarEvent[]
  defaultDurationMinutes: number
  isBusy: boolean
  error?: string | null
  onAdd: (input: CreateScheduledBlockInput) => Promise<boolean>
  onDelete: (id: string) => void
}

interface PendingDrop {
  task: Task
  dateKey: string
}

export function ScheduleDragPlanner({
  tasks,
  blocks,
  calendarEvents,
  defaultDurationMinutes,
  isBusy,
  error,
  onAdd,
  onDelete,
}: ScheduleDragPlannerProps) {
  const [pendingDrop, setPendingDrop] = useState<PendingDrop>()
  const [startTime, setStartTime] = useState('09:00')
  const [formError, setFormError] = useState<string>()
  const dateKeys = useMemo(() => getNextSevenDays(), [])
  const dayGroups = groupScheduleItemsByDate(
    blocks,
    calendarEvents,
    dateKeys,
  )
  const scheduledTaskIds = new Set(blocks.map((block) => block.taskId))
  const unscheduledTasks = tasks.filter(
    (task) => !scheduledTaskIds.has(task.id),
  )

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    const activeData = active.data.current
    const overData = over?.data.current
    if (
      activeData?.type !== 'task' ||
      typeof activeData.taskId !== 'string' ||
      overData?.type !== 'schedule-day' ||
      typeof overData.dateKey !== 'string'
    ) {
      return
    }

    const task = tasks.find((item) => item.id === activeData.taskId)
    if (!task) {
      return
    }

    setPendingDrop({ task, dateKey: overData.dateKey })
    setFormError(undefined)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!pendingDrop) {
      return
    }

    try {
      const { start, end } = createDroppedTaskTimeRange(
        pendingDrop.dateKey,
        startTime,
        pendingDrop.task,
        defaultDurationMinutes,
      )
      const succeeded = await onAdd({
        taskId: pendingDrop.task.id,
        title: pendingDrop.task.title,
        start,
        end,
        source: 'manual',
        syncedToGoogleCalendar: false,
      })

      if (succeeded) {
        setPendingDrop(undefined)
        setStartTime('09:00')
        setFormError(undefined)
      }
    } catch (submitError: unknown) {
      setFormError(toErrorMessage(submitError))
    }
  }

  const cancelPendingDrop = () => {
    setPendingDrop(undefined)
    setStartTime('09:00')
    setFormError(undefined)
  }

  return (
    <section className="drag-planner" aria-labelledby="drag-planner-title">
      <h2 id="drag-planner-title">拖曳排程</h2>
      <p className="drag-planner-help">
        將未排程任務拖到日期，再輸入開始時間確認排程。
      </p>

      <DndContext onDragEnd={handleDragEnd}>
        <div className="drag-planner-layout">
          <section className="draggable-task-panel" aria-label="未排程任務">
            <h3>未排程任務</h3>
            {unscheduledTasks.length === 0 ? (
              <p>目前沒有未排程任務。</p>
            ) : (
              <div className="draggable-task-list">
                {unscheduledTasks.map((task) => (
                  <DraggableTaskCard
                    key={task.id}
                    task={task}
                    disabled={isBusy}
                  />
                ))}
              </div>
            )}
          </section>

          <div className="droppable-day-list">
            {dayGroups.map((group) => (
              <DroppableScheduleDay
                key={group.dateKey}
                dateKey={group.dateKey}
                items={group.items}
                isBusy={isBusy}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      </DndContext>

      {pendingDrop && (
        <form
          className="pending-drop-form"
          onSubmit={(event) => void handleSubmit(event)}
        >
          <h3>
            將 {pendingDrop.task.title} 排到 {pendingDrop.dateKey}
          </h3>
          <label>
            開始時間
            <input
              required
              type="time"
              value={startTime}
              onChange={(event) => setStartTime(event.target.value)}
            />
          </label>
          {(formError || error) && (
            <p className="error-message">{formError ?? error}</p>
          )}
          <div className="pending-drop-actions">
            <button type="submit" disabled={isBusy}>
              確認排程
            </button>
            <button
              type="button"
              className="secondary"
              disabled={isBusy}
              onClick={cancelPendingDrop}
            >
              取消
            </button>
          </div>
        </form>
      )}
    </section>
  )
}
